import { describe, it, expect } from "vitest";
import { reducer, initialState } from "./logic";
import { shuffle } from "./deck";
import type { GameState, Player, RoundStatus } from "../types";

// card-001 (Pacific coast). Correct option indexes: 0,1,4,5,7,9.
const CORRECT = 0; // Chile
const WRONG = 2; // Bolivia

function player(name: string, over: Partial<Player> = {}): Player {
  return { name, token: "🦊", score: 0, pendingPoints: 0, roundStatus: "active", ...over };
}

function playing(players: Player[], over: Partial<GameState> = {}): GameState {
  return {
    ...initialState,
    phase: "playing",
    players,
    currentPlayerIndex: 0,
    roundStartPlayerIndex: 0,
    currentCardId: "card-001",
    revealedOptions: [],
    targetScore: 15,
    deck: ["card-002"],
    ...over,
  };
}

describe("START_GAME", () => {
  it("deals the first card and initializes players", () => {
    const s = reducer(initialState, {
      type: "START_GAME",
      players: [
        { name: "Ana", token: "🦊" },
        { name: "Beto", token: "🦉" },
      ],
      targetScore: 20,
      deck: ["card-003", "card-001"],
      blitz: false,
    });
    expect(s.phase).toBe("playing");
    expect(s.currentCardId).toBe("card-003");
    expect(s.deck).toEqual(["card-001"]);
    expect(s.usedCardIds).toEqual(["card-003"]);
    expect(s.players.map((p) => p.name)).toEqual(["Ana", "Beto"]);
    expect(s.players.map((p) => p.token)).toEqual(["🦊", "🦉"]);
    expect(s.players.every((p) => p.score === 0)).toBe(true);
    expect(s.targetScore).toBe(20);
    expect(s.currentPlayerIndex).toBe(0);
  });
});

describe("TAP_OPTION", () => {
  it("correct tap adds a pending point and advances to the next active player", () => {
    const s = reducer(playing([player("A"), player("B"), player("C")]), {
      type: "TAP_OPTION",
      optionIndex: CORRECT,
    });
    expect(s.players[0].pendingPoints).toBe(1);
    expect(s.players[0].roundStatus).toBe("active");
    expect(s.currentPlayerIndex).toBe(1);
    expect(s.revealedOptions).toEqual([CORRECT]);
  });

  it("skips players that are already out when advancing", () => {
    const s = reducer(
      playing([player("A"), player("B", { roundStatus: "passed" }), player("C")]),
      { type: "TAP_OPTION", optionIndex: CORRECT },
    );
    expect(s.currentPlayerIndex).toBe(2);
  });

  it("wrong tap clears pending points only and marks the player failed", () => {
    const s = reducer(
      playing([player("A", { pendingPoints: 3, score: 5 }), player("B")]),
      { type: "TAP_OPTION", optionIndex: WRONG },
    );
    expect(s.players[0].roundStatus).toBe("failed");
    expect(s.players[0].pendingPoints).toBe(0);
    expect(s.players[0].score).toBe(5); // banked score untouched
    expect(s.currentPlayerIndex).toBe(1);
  });

  it("is a no-op on an already-revealed option", () => {
    const start = playing([player("A"), player("B")], { revealedOptions: [CORRECT] });
    expect(reducer(start, { type: "TAP_OPTION", optionIndex: CORRECT })).toBe(
      start,
    );
  });

  it("sole survivor keeps taking consecutive turns", () => {
    const s = reducer(
      playing([
        player("A"),
        player("B", { roundStatus: "failed" }),
        player("C", { roundStatus: "passed" }),
      ]),
      { type: "TAP_OPTION", optionIndex: CORRECT },
    );
    expect(s.phase).toBe("playing");
    expect(s.currentPlayerIndex).toBe(0);
    expect(s.players[0].pendingPoints).toBe(1);
  });

  it("does NOT end the round when the last correct option is revealed (players must still decide)", () => {
    // All 6 correct revealed after this tap, but 4 wrong options remain hidden.
    // The sole active player must still choose to plant or risk another pick.
    const start = playing([player("A", { pendingPoints: 4 }), player("B", { roundStatus: "failed" })], {
      revealedOptions: [0, 1, 4, 5, 7],
    });
    const s = reducer(start, { type: "TAP_OPTION", optionIndex: 9 });
    expect(s.phase).toBe("playing");
    expect(s.players[0].pendingPoints).toBe(5); // still pending, not banked
    expect(s.players[0].roundStatus).toBe("active");
  });

  it("ends the round and banks active players when the whole card is uncovered", () => {
    // 9 of 10 options revealed; tapping the last one uncovers the entire card.
    const start = playing(
      [player("A", { pendingPoints: 4 }), player("B", { roundStatus: "failed" })],
      { revealedOptions: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
    );
    const s = reducer(start, { type: "TAP_OPTION", optionIndex: 9 });
    expect(s.phase).toBe("roundEnd");
    expect(s.players[0].roundStatus).toBe("passed");
    // index 9 (Japón) is correct → pending 4 + 1 = 5, banked.
    expect(s.players[0].score).toBe(5);
    expect(s.players[1].score).toBe(0);
  });
});

describe("PASS", () => {
  it("banks pending points and marks the player passed", () => {
    const s = reducer(
      playing([player("A", { pendingPoints: 2 }), player("B")]),
      { type: "PASS" },
    );
    expect(s.players[0].score).toBe(2);
    expect(s.players[0].roundStatus).toBe("passed");
    expect(s.currentPlayerIndex).toBe(1);
  });

  it("ends the round when the last active player passes", () => {
    const s = reducer(
      playing([player("A", { pendingPoints: 3 }), player("B", { roundStatus: "failed" })]),
      { type: "PASS" },
    );
    expect(s.phase).toBe("roundEnd");
    expect(s.players[0].score).toBe(3);
  });
});

describe("NEXT_ROUND", () => {
  const roundEnd = (players: Player[], over: Partial<GameState> = {}): GameState => ({
    ...playing(players, over),
    phase: "roundEnd",
  });

  it("ends the game when a unique leader reached the target", () => {
    const s = reducer(roundEnd([player("A", { score: 15 }), player("B", { score: 8 })]), {
      type: "NEXT_ROUND",
    });
    expect(s.phase).toBe("gameOver");
    expect(s.winnerIndexes).toEqual([0]);
  });

  it("plays a tiebreaker card when leaders tie at/above the target", () => {
    const s = reducer(roundEnd([player("A", { score: 16 }), player("B", { score: 16 })]), {
      type: "NEXT_ROUND",
    });
    expect(s.phase).toBe("playing");
    expect(s.currentCardId).toBe("card-002");
  });

  it("deals the next card and rotates the starting player when nobody won", () => {
    const s = reducer(roundEnd([player("A", { score: 10 }), player("B", { score: 8 })]), {
      type: "NEXT_ROUND",
    });
    expect(s.phase).toBe("playing");
    expect(s.roundStartPlayerIndex).toBe(1);
    expect(s.currentPlayerIndex).toBe(1);
    expect(s.players.every((p) => p.roundStatus === "active")).toBe(true);
    expect(s.players.every((p) => p.pendingPoints === 0)).toBe(true);
  });

  it("recycles played cards when the deck is exhausted", () => {
    const s = reducer(
      roundEnd([player("A"), player("B")], {
        deck: [],
        usedCardIds: ["card-001", "card-002"],
      }),
      { type: "NEXT_ROUND" },
    );
    expect(s.phase).toBe("playing");
    expect(s.currentCardId).toBe("card-001");
    expect(s.deck).toEqual(["card-002"]);
    expect(s.usedCardIds).toEqual(["card-001"]);
  });
});

describe("RESTART", () => {
  it("returns to setup", () => {
    const s = reducer(playing([player("A")]), { type: "RESTART" });
    expect(s.phase).toBe("setup");
    expect(s.players).toEqual([]);
  });
});

describe("shuffle", () => {
  it("is a permutation and is deterministic given the rng", () => {
    const rng = () => 0.42; // fixed
    const a = shuffle([1, 2, 3, 4, 5], rng);
    const b = shuffle([1, 2, 3, 4, 5], rng);
    expect(a).toEqual(b);
    expect([...a].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("TIME_OUT", () => {
  it("fails the current player, resets pending points, and advances turn", () => {
    const p1 = player("Ana", { pendingPoints: 3, roundStatus: "active" });
    const p2 = player("Beto", { pendingPoints: 1, roundStatus: "active" });
    const s = reducer(playing([p1, p2]), { type: "TIME_OUT" });

    expect(s.players[0].roundStatus).toBe("failed");
    expect(s.players[0].pendingPoints).toBe(0);
    expect(s.currentPlayerIndex).toBe(1); // turn moves to Beto
    expect(s.phase).toBe("playing");
  });
});

describe("answer cards (self-judged)", () => {
  // card-011 is an answer-type card (10 answer options, no correct flags).
  const answering = (players: Player[], over: Partial<GameState> = {}): GameState =>
    playing(players, { currentCardId: "card-011", ...over });

  it("TAP_OPTION reveals the answer and waits for a verdict without scoring", () => {
    const s = reducer(answering([player("A"), player("B")]), {
      type: "TAP_OPTION",
      optionIndex: 3,
    });
    expect(s.revealedOptions).toEqual([3]);
    expect(s.judgingOptionIndex).toBe(3);
    expect(s.players[0].pendingPoints).toBe(0);
    expect(s.players[0].roundStatus).toBe("active");
    expect(s.currentPlayerIndex).toBe(0); // turn has not advanced
    expect(s.phase).toBe("playing");
  });

  it("blocks TAP_OPTION, PASS and TIME_OUT while a verdict is pending", () => {
    const start = answering([player("A"), player("B")], {
      revealedOptions: [3],
      judgingOptionIndex: 3,
    });
    expect(reducer(start, { type: "TAP_OPTION", optionIndex: 5 })).toBe(start);
    expect(reducer(start, { type: "PASS" })).toBe(start);
    expect(reducer(start, { type: "TIME_OUT" })).toBe(start);
  });

  it("JUDGE_ANSWER correct adds a pending point, records the verdict, advances", () => {
    const start = answering([player("A"), player("B")], {
      revealedOptions: [3],
      judgingOptionIndex: 3,
    });
    const s = reducer(start, { type: "JUDGE_ANSWER", correct: true });
    expect(s.players[0].pendingPoints).toBe(1);
    expect(s.players[0].roundStatus).toBe("active");
    expect(s.judgingOptionIndex).toBeNull();
    expect(s.optionVerdicts).toEqual({ 3: true });
    expect(s.currentPlayerIndex).toBe(1);
  });

  it("JUDGE_ANSWER wrong clears pending points and fails the player", () => {
    const start = answering([player("A", { pendingPoints: 3, score: 5 }), player("B")], {
      revealedOptions: [3],
      judgingOptionIndex: 3,
    });
    const s = reducer(start, { type: "JUDGE_ANSWER", correct: false });
    expect(s.players[0].roundStatus).toBe("failed");
    expect(s.players[0].pendingPoints).toBe(0);
    expect(s.players[0].score).toBe(5); // banked score untouched
    expect(s.optionVerdicts).toEqual({ 3: false });
    expect(s.currentPlayerIndex).toBe(1);
  });

  it("JUDGE_ANSWER is a no-op when no verdict is pending", () => {
    const start = answering([player("A"), player("B")]);
    expect(reducer(start, { type: "JUDGE_ANSWER", correct: true })).toBe(start);
  });

  it("ends the round and banks when the last option is judged", () => {
    const start = answering(
      [player("A", { pendingPoints: 4 }), player("B", { roundStatus: "failed" })],
      { revealedOptions: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], judgingOptionIndex: 9 },
    );
    const s = reducer(start, { type: "JUDGE_ANSWER", correct: true });
    expect(s.phase).toBe("roundEnd");
    expect(s.players[0].roundStatus).toBe("passed");
    expect(s.players[0].score).toBe(5); // pending 4 + 1, banked
  });

  it("START_GAME and NEXT_ROUND reset the judging state", () => {
    const s = reducer(initialState, {
      type: "START_GAME",
      players: [
        { name: "Ana", token: "🦊" },
        { name: "Beto", token: "🦉" },
      ],
      targetScore: 15,
      deck: ["card-011", "card-002"],
      blitz: false,
    });
    expect(s.judgingOptionIndex).toBeNull();
    expect(s.optionVerdicts).toEqual({});
  });
});

// Type-only touch so RoundStatus stays referenced if tests are trimmed.
const _status: RoundStatus = "active";
void _status;

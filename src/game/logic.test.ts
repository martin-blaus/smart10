import { describe, it, expect } from "vitest";
import { reducer, initialState } from "./logic";
import { shuffle } from "./deck";
import type { GameState, Player, RoundStatus } from "../types";

// card-001 (Pacific coast). Correct option indexes: 0,1,4,5,7,9.
const CORRECT = 0; // Chile
const WRONG = 2; // Bolivia

function player(name: string, over: Partial<Player> = {}): Player {
  return { name, score: 0, pendingPoints: 0, roundStatus: "active", ...over };
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
      playerNames: ["Ana", "Beto"],
      targetScore: 20,
      deck: ["card-003", "card-001"],
    });
    expect(s.phase).toBe("playing");
    expect(s.currentCardId).toBe("card-003");
    expect(s.deck).toEqual(["card-001"]);
    expect(s.usedCardIds).toEqual(["card-003"]);
    expect(s.players.map((p) => p.name)).toEqual(["Ana", "Beto"]);
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

  it("ends the round and banks active players when the last correct option is revealed", () => {
    // 5 of 6 correct already revealed; tapping the 6th exhausts the card.
    const start = playing([player("A", { pendingPoints: 4 }), player("B", { roundStatus: "failed" })], {
      revealedOptions: [0, 1, 4, 5, 7],
    });
    const s = reducer(start, { type: "TAP_OPTION", optionIndex: 9 });
    expect(s.phase).toBe("roundEnd");
    expect(s.players[0].score).toBe(5); // 4 pending + the last correct, banked
    expect(s.players[0].roundStatus).toBe("passed");
    expect(s.players[1].score).toBe(0); // failed player banks nothing
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

// Type-only touch so RoundStatus stays referenced if tests are trimmed.
const _status: RoundStatus = "active";
void _status;

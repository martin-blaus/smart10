import type { Action, GameState, Player, PlayerStats } from "../types";
import { getCard } from "./deck";
import { isAnswerCard } from "../../data";

export const initialState: GameState = {
  phase: "setup",
  players: [],
  currentPlayerIndex: 0,
  roundStartPlayerIndex: 0,
  deck: [],
  usedCardIds: [],
  currentCardId: null,
  revealedOptions: [],
  judgingOptionIndex: null,
  optionVerdicts: {},
  targetScore: 15,
  winnerIndexes: [],
  blitz: false,
};

// Firebase RTDB silently drops empty arrays, empty objects, and null values on
// write. A GameState round-tripped through the database therefore comes back
// with holes: `revealedOptions`/`usedCardIds`/`winnerIndexes` missing when
// empty, `optionVerdicts` missing when empty, and `judgingOptionIndex` missing
// when null. The reducer and UI assume these are always present (e.g.
// `revealedOptions.includes(...)`), so rehydrate them before use. Pure, so it
// stays safe to call inside an RTDB transaction.
export function normalizeGameState(raw: any): GameState {
  return {
    ...raw,
    players: (raw.players ?? []).map((p: any) => ({
      ...p,
      score: p.score ?? 0,
      pendingPoints: p.pendingPoints ?? 0,
      roundStatus: p.roundStatus ?? "active",
      stats: { ...emptyStats(), ...(p.stats ?? {}) },
    })),
    deck: raw.deck ?? [],
    usedCardIds: raw.usedCardIds ?? [],
    revealedOptions: raw.revealedOptions ?? [],
    optionVerdicts: raw.optionVerdicts ?? {},
    winnerIndexes: raw.winnerIndexes ?? [],
    judgingOptionIndex: raw.judgingOptionIndex ?? null,
    currentCardId: raw.currentCardId ?? null,
  };
}

export function emptyStats(): PlayerStats {
  return {
    correct: 0,
    wrong: 0,
    timeouts: 0,
    planted: 0,
    bestStreak: 0,
    currentStreak: 0,
    bestRound: 0,
  };
}

function makePlayer(name: string, token: string): Player {
  return {
    name,
    token,
    score: 0,
    pendingPoints: 0,
    roundStatus: "active",
    stats: emptyStats(),
  };
}

// Next player (cyclic) whose round status is still "active". Returns the same
// index when only one active player remains (sole survivor keeps playing), or
// -1 when no player is active.
function nextActiveIndex(players: Player[], from: number): number {
  const n = players.length;
  for (let step = 1; step <= n; step++) {
    const i = (from + step) % n;
    if (players[i].roundStatus === "active") return i;
  }
  if (players[from]?.roundStatus === "active") return from;
  return -1;
}

// The round does NOT end just because every correct answer happens to be
// revealed — players can't see that, and deciding when to stop is the whole
// game. It ends only when nobody is active or the entire card is uncovered.
function allOptionsRevealed(state: GameState): boolean {
  const card = getCard(state.currentCardId);
  if (!card) return false;
  return state.revealedOptions.length >= card.options.length;
}

// Bank a player's pending points into their permanent score. `plant` marks a
// voluntary PASS (increments the `planted` stat); a forced bank at round end
// (the card ran out, or everyone else is out) passes `plant: false` since
// nobody chose to stop.
function bank(p: Player, plant: boolean): Player {
  return {
    ...p,
    score: p.score + p.pendingPoints,
    roundStatus: "passed" as const,
    stats: {
      ...p.stats,
      planted: p.stats.planted + (plant ? 1 : 0),
      bestRound: Math.max(p.stats.bestRound, p.pendingPoints),
    },
  };
}

// Bank the pending points of every still-active player and move to roundEnd.
function endRound(state: GameState): GameState {
  const players = state.players.map((p) =>
    p.roundStatus === "active" ? bank(p, false) : p,
  );
  return { ...state, players, phase: "roundEnd" };
}

// After a turn, either advance to the next active player or, if the round is
// over (nobody active, or the whole card is uncovered), close the round.
function advanceOrEnd(state: GameState): GameState {
  if (state.players.every((p) => p.roundStatus !== "active")) {
    return endRound(state);
  }
  if (allOptionsRevealed(state)) {
    return endRound(state);
  }
  return {
    ...state,
    currentPlayerIndex: nextActiveIndex(
      state.players,
      state.currentPlayerIndex,
    ),
  };
}

function dealCard(state: GameState, startIndex: number): GameState {
  let deck = state.deck;
  let usedCardIds = state.usedCardIds;
  if (deck.length === 0) {
    // Ran out of unseen cards — recycle the played ones (deterministic, so the
    // reducer stays pure). Rare with a real deck; expected with the test set.
    deck = usedCardIds;
    usedCardIds = [];
  }
  const [nextCardId, ...rest] = deck;
  return {
    ...state,
    phase: "playing",
    players: state.players.map((p) => ({
      ...p,
      pendingPoints: 0,
      roundStatus: "active",
    })),
    currentPlayerIndex: startIndex,
    roundStartPlayerIndex: startIndex,
    deck: rest,
    usedCardIds: [...usedCardIds, nextCardId],
    currentCardId: nextCardId,
    revealedOptions: [],
    judgingOptionIndex: null,
    optionVerdicts: {},
  };
}

// Apply the Smart10 consequence of a right/wrong answer to the current player,
// then advance the turn or close the round. Shared by boolean taps, the
// self-judged verdict on answer cards, and TIME_OUT. `cause` distinguishes a
// timeout from a genuine wrong answer for stat-keeping purposes only.
function applyVerdict(
  state: GameState,
  correct: boolean,
  cause: "answer" | "timeout" = "answer",
): GameState {
  const players = state.players.map((p, i) => {
    if (i !== state.currentPlayerIndex) return p;
    if (correct) {
      const currentStreak = p.stats.currentStreak + 1;
      return {
        ...p,
        pendingPoints: p.pendingPoints + 1,
        stats: {
          ...p.stats,
          correct: p.stats.correct + 1,
          currentStreak,
          bestStreak: Math.max(p.stats.bestStreak, currentStreak),
        },
      };
    }
    return {
      ...p,
      pendingPoints: 0,
      roundStatus: "failed" as const,
      stats: {
        ...p.stats,
        wrong: p.stats.wrong + (cause === "answer" ? 1 : 0),
        timeouts: p.stats.timeouts + (cause === "timeout" ? 1 : 0),
        currentStreak: 0,
      },
    };
  });
  return advanceOrEnd({ ...state, players });
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "START_GAME": {
      const players = action.players.map((p) => makePlayer(p.name, p.token));
      const base: GameState = {
        ...initialState,
        players,
        targetScore: action.targetScore,
        deck: action.deck,
        usedCardIds: [],
        blitz: action.blitz,
      };
      return dealCard(base, 0);
    }

    case "TAP_OPTION": {
      if (state.phase !== "playing") return state;
      if (state.judgingOptionIndex !== null) return state;
      if (state.revealedOptions.includes(action.optionIndex)) return state;
      const card = getCard(state.currentCardId);
      if (!card) return state;
      const option = card.options[action.optionIndex];
      if (!option) return state;
      const current = state.players[state.currentPlayerIndex];
      if (current.roundStatus !== "active") return state;

      const revealed: GameState = {
        ...state,
        revealedOptions: [...state.revealedOptions, action.optionIndex],
      };

      // Answer cards: reveal the true answer and wait for the table's verdict.
      // No scoring or turn change happens until JUDGE_ANSWER.
      if (isAnswerCard(card)) {
        return { ...revealed, judgingOptionIndex: action.optionIndex };
      }

      // Boolean cards auto-validate on the tap. (card is narrowed to
      // BooleanCard here, so the option carries a `correct` flag.)
      return applyVerdict(revealed, card.options[action.optionIndex].correct);
    }

    case "JUDGE_ANSWER": {
      if (state.phase !== "playing") return state;
      if (state.judgingOptionIndex === null) return state;
      const judged: GameState = {
        ...state,
        judgingOptionIndex: null,
        optionVerdicts: {
          ...state.optionVerdicts,
          [state.judgingOptionIndex]: action.correct,
        },
      };
      return applyVerdict(judged, action.correct);
    }

    case "PASS": {
      if (state.phase !== "playing") return state;
      if (state.judgingOptionIndex !== null) return state;
      const current = state.players[state.currentPlayerIndex];
      if (current.roundStatus !== "active") return state;
      const players = state.players.map((p, i) =>
        i === state.currentPlayerIndex ? bank(p, true) : p,
      );
      return advanceOrEnd({ ...state, players });
    }

    case "TIME_OUT": {
      if (state.phase !== "playing") return state;
      if (state.judgingOptionIndex !== null) return state;
      const current = state.players[state.currentPlayerIndex];
      if (current.roundStatus !== "active") return state;
      // Running out of time is the same consequence as a wrong answer.
      return applyVerdict(state, false, "timeout");
    }

    case "NEXT_ROUND": {
      if (state.phase !== "roundEnd") return state;
      const maxScore = Math.max(...state.players.map((p) => p.score));
      if (maxScore >= state.targetScore) {
        const leaders = state.players
          .map((p, i) => ({ p, i }))
          .filter(({ p }) => p.score === maxScore)
          .map(({ i }) => i);
        if (leaders.length === 1) {
          return { ...state, phase: "gameOver", winnerIndexes: leaders };
        }
        // Tie at/above target — play a tiebreaker card.
      }
      const nextStart =
        (state.roundStartPlayerIndex + 1) % state.players.length;
      return dealCard(state, nextStart);
    }

    case "RESTART":
      return initialState;

    default:
      return state;
  }
}

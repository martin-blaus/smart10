import type { Action, GameState, Player } from "../types";
import { getCard } from "./deck";

export const initialState: GameState = {
  phase: "setup",
  players: [],
  currentPlayerIndex: 0,
  roundStartPlayerIndex: 0,
  deck: [],
  usedCardIds: [],
  currentCardId: null,
  revealedOptions: [],
  targetScore: 15,
  winnerIndexes: [],
};

function makePlayer(name: string): Player {
  return { name, score: 0, pendingPoints: 0, roundStatus: "active" };
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

function allCorrectRevealed(state: GameState): boolean {
  const card = getCard(state.currentCardId);
  if (!card) return false;
  return card.options.every(
    (opt, i) => !opt.correct || state.revealedOptions.includes(i),
  );
}

// Bank the pending points of every still-active player and move to roundEnd.
function endRound(state: GameState): GameState {
  const players = state.players.map((p) =>
    p.roundStatus === "active"
      ? { ...p, score: p.score + p.pendingPoints, roundStatus: "passed" as const }
      : p,
  );
  return { ...state, players, phase: "roundEnd" };
}

// After a turn, either advance to the next active player or, if the round is
// over (nobody active, or all correct options revealed), close the round.
function advanceOrEnd(state: GameState): GameState {
  if (state.players.every((p) => p.roundStatus !== "active")) {
    return endRound(state);
  }
  if (allCorrectRevealed(state)) {
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
  };
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "START_GAME": {
      const players = action.playerNames.map(makePlayer);
      const base: GameState = {
        ...initialState,
        players,
        targetScore: action.targetScore,
        deck: action.deck,
        usedCardIds: [],
      };
      return dealCard(base, 0);
    }

    case "TAP_OPTION": {
      if (state.phase !== "playing") return state;
      if (state.revealedOptions.includes(action.optionIndex)) return state;
      const card = getCard(state.currentCardId);
      if (!card) return state;
      const option = card.options[action.optionIndex];
      if (!option) return state;
      const current = state.players[state.currentPlayerIndex];
      if (current.roundStatus !== "active") return state;

      const players = state.players.map((p, i) => {
        if (i !== state.currentPlayerIndex) return p;
        return option.correct
          ? { ...p, pendingPoints: p.pendingPoints + 1 }
          : { ...p, pendingPoints: 0, roundStatus: "failed" as const };
      });

      const next: GameState = {
        ...state,
        players,
        revealedOptions: [...state.revealedOptions, action.optionIndex],
      };
      return advanceOrEnd(next);
    }

    case "PASS": {
      if (state.phase !== "playing") return state;
      const current = state.players[state.currentPlayerIndex];
      if (current.roundStatus !== "active") return state;
      const players = state.players.map((p, i) =>
        i === state.currentPlayerIndex
          ? { ...p, score: p.score + p.pendingPoints, roundStatus: "passed" as const }
          : p,
      );
      return advanceOrEnd({ ...state, players });
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

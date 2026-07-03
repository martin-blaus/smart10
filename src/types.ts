// Game state and actions. The reducer in game/logic.ts is pure: no randomness
// or clock reads happen inside it — shuffled decks are passed in via actions.

export type RoundStatus = "active" | "passed" | "failed";

export interface Player {
  name: string;
  score: number; // banked, permanent
  pendingPoints: number; // at risk during the current round
  roundStatus: RoundStatus;
}

export type Phase = "setup" | "playing" | "roundEnd" | "gameOver";

export interface GameState {
  phase: Phase;
  players: Player[];
  currentPlayerIndex: number;
  roundStartPlayerIndex: number;
  deck: string[]; // remaining card ids, shuffled
  usedCardIds: string[]; // cards already played this game
  currentCardId: string | null;
  revealedOptions: number[]; // option indexes revealed on the current card
  targetScore: number;
  winnerIndexes: number[]; // filled when phase === "gameOver"
}

export type Action =
  | {
      type: "START_GAME";
      playerNames: string[];
      targetScore: number;
      deck: string[];
    }
  | { type: "TAP_OPTION"; optionIndex: number }
  | { type: "PASS" }
  | { type: "NEXT_ROUND" }
  | { type: "RESTART" };

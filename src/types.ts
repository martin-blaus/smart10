// Game state and actions. The reducer in game/logic.ts is pure: no randomness
// or clock reads happen inside it — shuffled decks are passed in via actions.

export type RoundStatus = "active" | "passed" | "failed";

export interface Player {
  name: string;
  token: string; // emoji
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
  // Answer-card option that is revealed and awaiting the group's verdict, or
  // null when no judgment is pending.
  judgingOptionIndex: number | null;
  // Verdicts delivered on answer-card options this card (index → judged
  // correct). Used for rendering the peg green/red; cleared each new card.
  optionVerdicts: Record<number, boolean>;
  targetScore: number;
  winnerIndexes: number[]; // filled when phase === "gameOver"
  blitz: boolean;
}

export type Action =
  | {
      type: "START_GAME";
      players: { name: string; token: string }[];
      targetScore: number;
      deck: string[];
      blitz: boolean;
    }
  | { type: "TAP_OPTION"; optionIndex: number }
  | { type: "JUDGE_ANSWER"; correct: boolean }
  | { type: "PASS" }
  | { type: "NEXT_ROUND" }
  | { type: "RESTART" }
  | { type: "TIME_OUT" };

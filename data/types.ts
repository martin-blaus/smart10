// Dataset types. Content is Spanish; identifiers stay English.
export interface CardOption {
  text: string;
  correct: boolean;
  // Shown when the option is revealed (e.g. the actual figure). Optional.
  info?: string;
}

export interface Card {
  id: string;
  category: string;
  question: string;
  // Exactly 10 options per card (enforced by data/dataset.test.ts).
  options: CardOption[];
}

export interface Dataset {
  cards: Card[];
}

export const OPTIONS_PER_CARD = 10;

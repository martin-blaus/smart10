// Dataset types. Content is Spanish; identifiers stay English.

// Shared by every option kind.
interface CardOptionBase {
  text: string;
  // Shown when the option is revealed (e.g. the actual figure). Optional.
  info?: string;
}

// Auto-validated option: tapping it is right or wrong on its own.
export interface BooleanCardOption extends CardOptionBase {
  correct: boolean;
}

// Self-judged option: `text` names a subject, `answer` is the hidden true
// answer the player must say out loud. The table decides if they got it.
export interface AnswerCardOption extends CardOptionBase {
  answer: string;
}

export type CardOption = BooleanCardOption | AnswerCardOption;

interface CardBase {
  id: string;
  category: string;
  question: string;
}

// `type` omitted ⇒ "boolean", so existing datasets stay valid unchanged.
export interface BooleanCard extends CardBase {
  type?: "boolean";
  // Exactly 10 options per card (enforced by data/dataset.test.ts).
  options: BooleanCardOption[];
}

// Open-answer, self-judged card (see AnswerCardOption).
export interface AnswerCard extends CardBase {
  type: "answer";
  options: AnswerCardOption[];
}

export type Card = BooleanCard | AnswerCard;

export interface Dataset {
  cards: Card[];
}

export const OPTIONS_PER_CARD = 10;

// Narrows a card to the self-judged "answer" variant. New card types should
// each get a helper like this so call sites stay readable.
export function isAnswerCard(card: Card): card is AnswerCard {
  return card.type === "answer";
}

// Narrows an option to the self-judged "answer" variant (carries `answer`
// instead of `correct`). Companion to isAnswerCard for the option layer.
export function isAnswerCardOption(option: CardOption): option is AnswerCardOption {
  return "answer" in option;
}

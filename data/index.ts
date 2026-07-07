export type {
  Card,
  CardOption,
  BooleanCard,
  BooleanCardOption,
  AnswerCard,
  AnswerCardOption,
  Dataset,
} from "./types";
export { isAnswerCard, isAnswerCardOption } from "./types";
import type { Card, Dataset } from "./types";

import argentinaDatasetJson from "./argentina_dataset.json";
import triviaDatasetJson from "./trivia_dataset.json";

// Registry of playable datasets keyed by id. Add a theme by adding one entry
// here (and its label in the setup screen) — DatasetKey and the card lookup
// derive from this automatically.
export const DATASETS = {
  argentina: (argentinaDatasetJson as Dataset).cards,
  general: (triviaDatasetJson as Dataset).cards,
} satisfies Record<string, Card[]>;

export type DatasetKey = keyof typeof DATASETS;

export const ALL_CARDS: Card[] = Object.values(DATASETS).flat();

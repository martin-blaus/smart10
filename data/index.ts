export type { Card, CardOption, Dataset } from "./types";
import type { Card, Dataset } from "./types";

import datasetJson from "./dataset.json";
import moviesDatasetJson from "./movies_dataset.json";
import argentinaDatasetJson from "./argentina_dataset.json";

// Registry of playable datasets keyed by id. Add a theme by adding one entry
// here (and its label in the setup screen) — DatasetKey and the card lookup
// derive from this automatically.
export const DATASETS = {
  classic: (datasetJson as Dataset).cards,
  movies: (moviesDatasetJson as Dataset).cards,
  argentina: (argentinaDatasetJson as Dataset).cards,
} satisfies Record<string, Card[]>;

export type DatasetKey = keyof typeof DATASETS;

export const CARDS = DATASETS.classic;
export const MOVIE_CARDS = DATASETS.movies;
export const ALL_CARDS: Card[] = Object.values(DATASETS).flat();

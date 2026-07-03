export type { Card, CardOption, Dataset } from "./types";
import type { Dataset } from "./types";

import datasetJson from "./dataset.json";
import moviesDatasetJson from "./movies_dataset.json";

export const DATASET = datasetJson as Dataset;
export const CARDS = DATASET.cards;

export const MOVIES_DATASET = moviesDatasetJson as Dataset;
export const MOVIE_CARDS = MOVIES_DATASET.cards;


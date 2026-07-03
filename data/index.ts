export type { Card, CardOption, Dataset } from "./types";
import type { Dataset } from "./types";

import datasetJson from "./dataset.json";

export const DATASET = datasetJson as Dataset;
export const CARDS = DATASET.cards;

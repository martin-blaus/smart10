import { CARDS, MOVIE_CARDS } from "../../data";
import type { Card } from "../../data";

export type Rng = () => number;
export type DatasetKey = "classic" | "movies";

// Fisher-Yates. Pure given the rng; defaults to Math.random for real play.
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// A shuffled list of all card ids, ready to feed into START_GAME.
export function buildDeck(
  datasetKey: DatasetKey = "classic",
  rng: Rng = Math.random,
): string[] {
  const cards = datasetKey === "movies" ? MOVIE_CARDS : CARDS;
  return shuffle(
    cards.map((c) => c.id),
    rng,
  );
}

const ALL_CARDS = [...CARDS, ...MOVIE_CARDS];
const CARDS_BY_ID = new Map<string, Card>(ALL_CARDS.map((c) => [c.id, c]));

export function getCard(id: string | null): Card | null {
  return id ? (CARDS_BY_ID.get(id) ?? null) : null;
}


import { DATASETS, ALL_CARDS } from "../../data";
import type { Card, DatasetKey } from "../../data";

export type Rng = () => number;
export type DeckChoice = DatasetKey | "all";
export type { DatasetKey };

// Fisher-Yates. Pure given the rng; defaults to Math.random for real play.
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// A shuffled list of the chosen dataset's card ids, ready for START_GAME.
export function buildDeck(
  deckChoice: DeckChoice = "classic",
  rng: Rng = Math.random,
): string[] {
  const cards = deckChoice === "all" ? ALL_CARDS : DATASETS[deckChoice];
  return shuffle(
    cards.map((c) => c.id),
    rng,
  );
}

const ALL_CARDS_MAPPED = ALL_CARDS;
const CARDS_BY_ID = new Map<string, Card>(ALL_CARDS_MAPPED.map((c) => [c.id, c]));

export function getCard(id: string | null): Card | null {
  return id ? (CARDS_BY_ID.get(id) ?? null) : null;
}

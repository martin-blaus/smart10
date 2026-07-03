import { CARDS } from "../../data";
import type { Card } from "../../data";

export type Rng = () => number;

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
export function buildDeck(rng: Rng = Math.random): string[] {
  return shuffle(
    CARDS.map((c) => c.id),
    rng,
  );
}

const CARDS_BY_ID = new Map<string, Card>(CARDS.map((c) => [c.id, c]));

export function getCard(id: string | null): Card | null {
  return id ? (CARDS_BY_ID.get(id) ?? null) : null;
}

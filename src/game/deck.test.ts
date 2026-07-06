import { describe, it, expect } from "vitest";
import { buildDeck } from "./deck";
import { ALL_CARDS, DATASETS } from "../../data";

describe("buildDeck", () => {
  it("builds a deck for a specific dataset key", () => {
    const deck = buildDeck("classic");
    expect(deck).toHaveLength(DATASETS.classic.length);
  });

  it("builds a deck with all datasets mixed when 'all' is chosen", () => {
    const deck = buildDeck("all");
    expect(deck).toHaveLength(ALL_CARDS.length);

    // Verify it contains card IDs from all datasets
    const allIds = ALL_CARDS.map((c) => c.id);
    expect(new Set(deck)).toEqual(new Set(allIds));
  });
});

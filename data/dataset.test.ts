import { describe, it, expect } from "vitest";
import { CARDS } from "./index";
import { OPTIONS_PER_CARD } from "./types";

describe("dataset integrity", () => {
  it("has at least one card", () => {
    expect(CARDS.length).toBeGreaterThan(0);
  });

  it("has unique card ids", () => {
    const ids = CARDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const card of CARDS) {
    describe(`card ${card.id}`, () => {
      it("has a non-empty category and question", () => {
        expect(card.category.trim()).not.toBe("");
        expect(card.question.trim()).not.toBe("");
      });

      it(`has exactly ${OPTIONS_PER_CARD} options`, () => {
        expect(card.options).toHaveLength(OPTIONS_PER_CARD);
      });

      it("has at least one correct and one incorrect option", () => {
        expect(card.options.some((o) => o.correct)).toBe(true);
        expect(card.options.some((o) => !o.correct)).toBe(true);
      });

      it("has non-empty, unique option texts", () => {
        const texts = card.options.map((o) => o.text.trim());
        expect(texts.every((t) => t !== "")).toBe(true);
        expect(new Set(texts).size).toBe(texts.length);
      });
    });
  }
});

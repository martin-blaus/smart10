import { describe, it, expect } from "vitest";
import { DATASETS } from "./index";
import { OPTIONS_PER_CARD } from "./types";
import type { Card } from "./types";

describe("dataset integrity", () => {
  function runIntegrityTests(name: string, cards: Card[]) {
    describe(name, () => {
      it("has at least one card", () => {
        expect(cards.length).toBeGreaterThan(0);
      });

      it("has unique card ids", () => {
        const ids = cards.map((c) => c.id);
        expect(new Set(ids).size).toBe(ids.length);
      });

      for (const card of cards) {
        describe(`card ${card.id}`, () => {
          it("has a non-empty category and question", () => {
            expect(card.category.trim()).not.toBe("");
            expect(card.question.trim()).not.toBe("");
          });

          it("has a known type", () => {
            expect([undefined, "boolean", "answer"]).toContain(card.type);
          });

          it(`has exactly ${OPTIONS_PER_CARD} options`, () => {
            expect(card.options).toHaveLength(OPTIONS_PER_CARD);
          });

          it("has non-empty, unique option texts", () => {
            const texts = card.options.map((o) => o.text.trim());
            expect(texts.every((t) => t !== "")).toBe(true);
            expect(new Set(texts).size).toBe(texts.length);
          });

          if (card.type === "answer") {
            it("answer options carry a non-empty answer and no correct flag", () => {
              for (const o of card.options) {
                expect(typeof o.answer).toBe("string");
                expect(o.answer.trim()).not.toBe("");
                expect("correct" in o).toBe(false);
              }
            });
          } else {
            it("boolean options carry a boolean correct flag and no answer", () => {
              for (const o of card.options) {
                expect(typeof o.correct).toBe("boolean");
                expect("answer" in o).toBe(false);
              }
            });

            it("has at least one correct and one incorrect option", () => {
              expect(card.options.some((o) => o.correct)).toBe(true);
              expect(card.options.some((o) => !o.correct)).toBe(true);
            });
          }
        });
      }
    });
  }

  // Every registered dataset is validated automatically.
  for (const [key, cards] of Object.entries(DATASETS)) {
    runIntegrityTests(key, cards);
  }
});

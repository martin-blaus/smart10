import { describe, it, expect } from "vitest";
import { pickAwards } from "./awards";
import { emptyStats } from "./logic";
import type { Player, PlayerStats } from "../types";

function player(name: string, stats: Partial<PlayerStats> = {}): Player {
  return {
    name,
    token: "🦊",
    score: 0,
    pendingPoints: 0,
    roundStatus: "active",
    stats: { ...emptyStats(), ...stats },
  };
}

describe("pickAwards", () => {
  it("awards the streak trophy to a unique leader at/above threshold", () => {
    const players = [player("A", { bestStreak: 4 }), player("B", { bestStreak: 1 })];
    const awards = pickAwards(players);
    const streak = awards.find((a) => a.kind === "streak");
    expect(streak).toEqual({ kind: "streak", emoji: "🔥", playerIndex: 0, value: 4 });
  });

  it("skips the streak trophy below threshold", () => {
    const players = [player("A", { bestStreak: 2 }), player("B", { bestStreak: 1 })];
    expect(pickAwards(players).find((a) => a.kind === "streak")).toBeUndefined();
  });

  it("skips an award on a tie", () => {
    const players = [player("A", { bestStreak: 3 }), player("B", { bestStreak: 3 })];
    expect(pickAwards(players).find((a) => a.kind === "streak")).toBeUndefined();
  });

  it("awards 'daring' to whoever risked the most answers", () => {
    const players = [
      player("A", { correct: 2, wrong: 1, timeouts: 0 }),
      player("B", { correct: 1, wrong: 0, timeouts: 0 }),
    ];
    const daring = pickAwards(players).find((a) => a.kind === "daring");
    expect(daring).toEqual({ kind: "daring", emoji: "😤", playerIndex: 0, value: 3 });
  });

  it("awards 'planted' at/above threshold", () => {
    const players = [player("A", { planted: 3 }), player("B", { planted: 0 })];
    const planted = pickAwards(players).find((a) => a.kind === "planted");
    expect(planted).toEqual({ kind: "planted", emoji: "🌱", playerIndex: 0, value: 3 });
  });

  it("returns no awards when nobody qualifies", () => {
    expect(pickAwards([player("A"), player("B")])).toEqual([]);
  });
});

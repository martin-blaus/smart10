import type { Player } from "../types";

export type AwardKind = "streak" | "daring" | "planted";

export interface Award {
  kind: AwardKind;
  emoji: string;
  playerIndex: number;
  value: number;
}

// One "risked answer" per correct/wrong/timeout — a measure of how many times
// a player put pending points on the line, regardless of outcome.
function risked(p: Player): number {
  return p.stats.correct + p.stats.wrong + p.stats.timeouts;
}

// A single metric-based award: found the strict, unique maximum across
// players (a tie means nobody stood out, so the award doesn't render) that
// also clears a minimum threshold (so a game with no qualifying play doesn't
// hand out a trophy for doing almost nothing).
function pickAward(
  kind: AwardKind,
  emoji: string,
  players: Player[],
  metric: (p: Player) => number,
  threshold: number,
): Award | null {
  const values = players.map(metric);
  const max = Math.max(...values);
  if (max < threshold) return null;
  const leaders = values.filter((v) => v === max).length;
  if (leaders !== 1) return null;
  return { kind, emoji, playerIndex: values.indexOf(max), value: max };
}

// End-of-game awards, computed from final player stats. Skips any award
// without a unique winner (tie) or that nobody qualified for.
export function pickAwards(players: Player[]): Award[] {
  return [
    pickAward("streak", "🔥", players, (p) => p.stats.bestStreak, 3),
    pickAward("daring", "😤", players, risked, 1),
    pickAward("planted", "🌱", players, (p) => p.stats.planted, 2),
  ].filter((a): a is Award => a !== null);
}

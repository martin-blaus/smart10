import { useEffect } from "react";
import confetti from "canvas-confetti";
import type { GameState } from "../types";
import { strings } from "../i18n/strings";

interface Props {
  state: GameState;
  onPlayAgainSame: () => void;
  onPlayAgainNew: () => void;
}

export function ResultsScreen({ state, onPlayAgainSame, onPlayAgainNew }: Props) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    confetti({
      particleCount: 150,
      spread: 78,
      origin: { y: 0.6 },
      colors: ["#e0af52", "#f3ead3", "#3f8a5b", "#c68f30", "#b1503c"],
    });
  }, []);

  const ranked = state.players
    .map((p, i) => ({ p, i }))
    .sort((a, b) => b.p.score - a.p.score);
  const winnerName = state.players[state.winnerIndexes[0]]?.name ?? "";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 gap-7">
      <div className="text-center">
        <span className="text-5xl block mb-3" aria-hidden>
          🏆
        </span>
        <span className="eyebrow text-brass block mb-1">Ganador</span>
        <h1 className="font-display text-4xl font-bold text-parchment">
          {strings.winnerTitle(winnerName)}
        </h1>
      </div>

      <div className="w-full max-w-sm">
        <h2 className="eyebrow text-parchment-dim mb-2.5">
          {strings.finalStandings}
        </h2>
        <ol className="flex flex-col gap-2">
          {ranked.map(({ p, i }, pos) => (
            <li
              key={i}
              className={
                "flex items-center justify-between rounded-2xl px-4 py-3 " +
                (pos === 0 ? "card-stock" : "panel")
              }
            >
              <span
                className={
                  "flex items-center gap-2 " +
                  (pos === 0 ? "text-ink font-bold" : "text-parchment")
                }
              >
                <span className="tabular-nums opacity-60">{pos + 1}</span>
                {p.name}
              </span>
              <span
                className={
                  "font-display font-bold tabular-nums text-lg " +
                  (pos === 0 ? "text-brass-deep" : "text-parchment")
                }
              >
                {p.score} {strings.points}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-2.5">
        <button onClick={onPlayAgainSame} className="btn-brass text-lg">
          {strings.playAgainSame}
        </button>
        <button onClick={onPlayAgainNew} className="btn-quiet text-base">
          {strings.playAgainNew}
        </button>
      </div>
    </div>
  );
}

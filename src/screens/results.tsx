import { useEffect } from "react";
import confetti from "canvas-confetti";
import type { GameState } from "../types";
import { strings } from "../i18n/strings";
import { sounds } from "../sounds";
import { pickAwards, type AwardKind } from "../game/awards";

interface Props {
  state: GameState;
  onPlayAgainSame: () => void;
  onPlayAgainNew: () => void;
}

const AWARD_TITLES: Record<AwardKind, string> = {
  streak: strings.awardStreak,
  daring: strings.awardDaring,
  planted: strings.awardPlanted,
};

export function ResultsScreen({ state, onPlayAgainSame, onPlayAgainNew }: Props) {
  useEffect(() => {
    sounds.win();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    confetti({
      particleCount: 150,
      spread: 78,
      origin: { y: 0.6 },
      colors: ["#e0af52", "#f3ead3", "#3f8a5b", "#c68f30", "#b1503c"],
    });
  }, []);

  const isSolo = state.players.length === 1;
  const ranked = state.players
    .map((p, i) => ({ p, i }))
    .sort((a, b) => b.p.score - a.p.score);
  const winner = state.players[state.winnerIndexes[0]];
  const winnerName = winner?.name ?? "";
  const winnerToken = winner?.token ?? "";
  const soloToken = state.players[0]?.token ?? "";
  const awards = isSolo ? [] : pickAwards(state.players);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 gap-7">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2.5 text-5xl mb-3" aria-hidden>
          <span>🏆</span>
          <span className="select-none">{isSolo ? soloToken : winnerToken}</span>
        </div>
        <span className="eyebrow text-brass block mb-1">
          {isSolo ? strings.soloResultEyebrow : "Ganador"}
        </span>
        <h1 className="font-display text-4xl font-bold text-parchment">
          {isSolo ? strings.soloResultTitle : strings.winnerTitle(winnerName)}
        </h1>
        {isSolo && (
          <p className="font-display text-2xl font-bold text-brass mt-3">
            {ranked[0].p.score} {strings.points}
          </p>
        )}
      </div>

      {isSolo ? (
        <div className="w-full max-w-sm grid grid-cols-2 gap-2.5">
          {[
            { label: strings.soloStatsCorrect, value: ranked[0].p.stats.correct },
            {
              label: strings.soloStatsWrong,
              value: ranked[0].p.stats.wrong + ranked[0].p.stats.timeouts,
            },
            { label: strings.soloStatsBestStreak, value: ranked[0].p.stats.bestStreak },
            { label: strings.soloStatsBestRound, value: ranked[0].p.stats.bestRound },
          ].map((stat) => (
            <div key={stat.label} className="panel rounded-2xl px-4 py-3 text-center">
              <span className="block font-display text-2xl font-bold text-parchment tabular-nums">
                {stat.value}
              </span>
              <span className="eyebrow text-parchment-dim">{stat.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <>
          {awards.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 max-w-sm">
              {awards.map((a) => {
                const p = state.players[a.playerIndex];
                return (
                  <div
                    key={a.kind}
                    className="panel rounded-2xl px-3 py-2 flex items-center gap-2"
                  >
                    <span aria-hidden className="text-xl">{a.emoji}</span>
                    <span className="flex flex-col leading-tight">
                      <span className="eyebrow text-parchment-dim text-[0.65rem]">
                        {AWARD_TITLES[a.kind]}
                      </span>
                      <span className="text-sm text-parchment flex items-center gap-1">
                        <span aria-hidden="true" className="select-none">{p.token}</span>
                        {p.name}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}

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
                  <span aria-hidden="true" className="select-none">{p.token}</span>
                  <span className="flex flex-col leading-tight">
                    <span>{p.name}</span>
                    <span
                      className={
                        "text-xs font-normal tabular-nums " +
                        (pos === 0 ? "text-ink-soft" : "text-parchment-dim")
                      }
                    >
                      {strings.statsLine(p.stats.correct, p.stats.wrong + p.stats.timeouts, p.stats.bestStreak)}
                    </span>
                  </span>
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
        </>
      )}

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

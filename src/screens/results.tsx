import type { GameState } from "../types";
import { strings } from "../i18n/strings";

interface Props {
  state: GameState;
  onPlayAgainSame: () => void;
  onPlayAgainNew: () => void;
}

export function ResultsScreen({ state, onPlayAgainSame, onPlayAgainNew }: Props) {
  const ranked = state.players
    .map((p, i) => ({ p, i }))
    .sort((a, b) => b.p.score - a.p.score);
  const winnerName = state.players[state.winnerIndexes[0]]?.name ?? "";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 gap-6">
      <h1 className="text-3xl font-black text-text-primary text-center">
        🏆 {strings.winnerTitle(winnerName)}
      </h1>

      <div className="w-full max-w-md">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-tertiary mb-2">
          {strings.finalStandings}
        </h2>
        <ol className="flex flex-col gap-1">
          {ranked.map(({ p, i }, pos) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-xl bg-bg-card border border-border px-4 py-3"
            >
              <span className="text-text-primary">
                {pos + 1}. {p.name}
              </span>
              <span className="font-bold tabular-nums">
                {p.score} {strings.points}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="w-full max-w-md flex flex-col gap-2">
        <button onClick={onPlayAgainSame} className="btn-primary text-base">
          {strings.playAgainSame}
        </button>
        <button onClick={onPlayAgainNew} className="btn-secondary text-base">
          {strings.playAgainNew}
        </button>
      </div>
    </div>
  );
}

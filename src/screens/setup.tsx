import { useState } from "react";
import { strings } from "../i18n/strings";

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;
const TARGET_OPTIONS = [10, 15, 20];

interface Props {
  onStart: (playerNames: string[], targetScore: number) => void;
}

export function SetupScreen({ onStart }: Props) {
  const [names, setNames] = useState<string[]>(["", ""]);
  const [targetScore, setTargetScore] = useState(15);

  const setName = (i: number, value: string) =>
    setNames((prev) => prev.map((n, j) => (j === i ? value : n)));

  const addPlayer = () =>
    setNames((prev) => (prev.length < MAX_PLAYERS ? [...prev, ""] : prev));

  const removePlayer = (i: number) =>
    setNames((prev) =>
      prev.length > MIN_PLAYERS ? prev.filter((_, j) => j !== i) : prev,
    );

  const trimmed = names.map((n, i) => n.trim() || strings.setupPlayerPlaceholder(i + 1));
  const canStart = names.filter((n) => n.trim()).length >= MIN_PLAYERS || names.length >= MIN_PLAYERS;

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      <h1 className="text-4xl font-black text-text-primary mt-6 mb-1">
        {strings.appTitle}
      </h1>
      <p className="text-text-secondary text-sm text-center max-w-xs mb-8">
        {strings.tagline}
      </p>

      <div className="w-full max-w-md">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-tertiary mb-2">
          {strings.setupPlayers}
        </h2>
        <div className="flex flex-col gap-2">
          {names.map((name, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={name}
                onChange={(e) => setName(i, e.target.value)}
                placeholder={strings.setupPlayerPlaceholder(i + 1)}
                maxLength={20}
                className="flex-1 min-h-11 rounded-xl border border-border bg-bg-card px-4 text-text-primary placeholder:text-text-tertiary"
              />
              {names.length > MIN_PLAYERS && (
                <button
                  onClick={() => removePlayer(i)}
                  className="btn-secondary px-3"
                  aria-label={strings.setupRemovePlayer}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {names.length < MAX_PLAYERS && (
          <button onClick={addPlayer} className="btn-secondary w-full mt-2">
            + {strings.setupAddPlayer}
          </button>
        )}

        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-tertiary mt-8 mb-2">
          {strings.setupTargetScore}
        </h2>
        <div className="flex gap-2">
          {TARGET_OPTIONS.map((t) => (
            <button
              key={t}
              onClick={() => setTargetScore(t)}
              className={
                "flex-1 min-h-11 rounded-xl border font-semibold transition-colors " +
                (targetScore === t
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-bg-card text-text-secondary")
              }
            >
              {t}
            </button>
          ))}
        </div>

        <button
          onClick={() => onStart(trimmed, targetScore)}
          disabled={!canStart}
          className="btn-primary w-full mt-8 text-base"
        >
          {strings.setupStart}
        </button>
        {!canStart && (
          <p className="text-danger text-xs text-center mt-2">
            {strings.setupMinPlayers}
          </p>
        )}
      </div>
    </div>
  );
}

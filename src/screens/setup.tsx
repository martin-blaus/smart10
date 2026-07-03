import { useState } from "react";
import { strings } from "../i18n/strings";

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;
const TARGET_OPTIONS = [10, 15, 20];

import type { DatasetKey } from "../game/deck";

interface Props {
  onStart: (playerNames: string[], targetScore: number, datasetKey: DatasetKey) => void;
}

export function SetupScreen({ onStart }: Props) {
  const [names, setNames] = useState<string[]>(["", ""]);
  const [targetScore, setTargetScore] = useState(15);
  const [datasetKey, setDatasetKey] = useState<DatasetKey>("classic");

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
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10">
      <div className="text-center mb-9">
        <span className="eyebrow text-brass block mb-1">Juego de preguntas</span>
        <h1 className="text-[clamp(2.75rem,15vw,3.75rem)] font-bold text-parchment tracking-tight leading-none">
          {strings.appTitle}
        </h1>
        <p className="text-parchment-dim text-sm max-w-xs mx-auto mt-3">
          {strings.tagline}
        </p>
      </div>

      <div className="w-full max-w-sm">
        <h2 className="eyebrow text-parchment-dim mb-2.5">
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
                className="field flex-1"
              />
              {names.length > MIN_PLAYERS && (
                <button
                  onClick={() => removePlayer(i)}
                  className="btn-quiet px-4"
                  aria-label={strings.setupRemovePlayer}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {names.length < MAX_PLAYERS && (
          <button onClick={addPlayer} className="btn-quiet w-full mt-2.5">
            + {strings.setupAddPlayer}
          </button>
        )}

        <h2 className="eyebrow text-parchment-dim mt-8 mb-2.5">
          {strings.setupTargetScore}
        </h2>
        <div className="flex gap-2.5">
          {TARGET_OPTIONS.map((t) => (
            <button
              key={t}
              onClick={() => setTargetScore(t)}
              aria-pressed={targetScore === t}
              className={
                "flex-1 min-h-14 rounded-2xl font-display text-2xl font-bold transition-transform active:scale-[0.97] " +
                (targetScore === t
                  ? "btn-brass !px-0"
                  : "panel text-parchment-dim")
              }
            >
              {t}
            </button>
          ))}
        </div>

        <h2 className="eyebrow text-parchment-dim mt-8 mb-2.5">
          {strings.setupDataset}
        </h2>
        <div className="flex gap-2.5">
          <button
            onClick={() => setDatasetKey("classic")}
            aria-pressed={datasetKey === "classic"}
            className={
              "flex-1 min-h-14 rounded-2xl font-display text-lg font-bold transition-transform active:scale-[0.97] " +
              (datasetKey === "classic"
                ? "btn-brass"
                : "panel text-parchment-dim")
            }
          >
            {strings.datasetGeneral}
          </button>
          <button
            onClick={() => setDatasetKey("movies")}
            aria-pressed={datasetKey === "movies"}
            className={
              "flex-1 min-h-14 rounded-2xl font-display text-lg font-bold transition-transform active:scale-[0.97] " +
              (datasetKey === "movies"
                ? "btn-brass"
                : "panel text-parchment-dim")
            }
          >
            {strings.datasetMovies}
          </button>
        </div>

        <button
          onClick={() => onStart(trimmed, targetScore, datasetKey)}
          disabled={!canStart}
          className="btn-brass w-full mt-8 text-lg"
        >
          {strings.setupStart}
        </button>
        {!canStart && (
          <p className="text-wrong text-xs text-center mt-2.5">
            {strings.setupMinPlayers}
          </p>
        )}
      </div>
    </div>
  );
}

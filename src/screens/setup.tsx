import { useState } from "react";
import { strings } from "../i18n/strings";
import { DATASETS } from "../../data";
import type { DeckChoice } from "../game/deck";
import { MuteButton } from "../components/mute_button";

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;
const TARGET_OPTIONS = [10, 15, 20];

const DATASET_LABELS: Record<DeckChoice, string> = {
  classic: strings.datasetGeneral,
  movies: strings.datasetMovies,
  argentina: strings.datasetArgentina,
  all: strings.datasetAll,
};

// Shared styling for the segmented option toggles (target score, dataset).
const segClass = (selected: boolean, size: string) =>
  `flex-grow flex-shrink basis-[calc(50%-5px)] sm:flex-1 min-h-14 rounded-2xl font-display ${size} font-bold transition-transform active:scale-[0.97] ` +
  (selected ? "btn-brass !px-0" : "panel text-parchment-dim");

interface Props {
  onStart: (playerNames: string[], targetScore: number, deckChoice: DeckChoice) => void;
}

type Mode = "solo" | "multi";

export function SetupScreen({ onStart }: Props) {
  const [mode, setMode] = useState<Mode>("multi");
  const [names, setNames] = useState<string[]>(["", ""]);
  const [targetScore, setTargetScore] = useState(15);
  const [datasetKey, setDatasetKey] = useState<DeckChoice>("classic");

  const setName = (i: number, value: string) =>
    setNames((prev) => prev.map((n, j) => (j === i ? value : n)));

  const addPlayer = () =>
    setNames((prev) => (prev.length < MAX_PLAYERS ? [...prev, ""] : prev));

  const removePlayer = (i: number) =>
    setNames((prev) =>
      prev.length > MIN_PLAYERS ? prev.filter((_, j) => j !== i) : prev,
    );

  const trimmed = names.map((n, i) => n.trim() || strings.setupPlayerPlaceholder(i + 1));
  const canStart = mode === "solo" || names.length >= MIN_PLAYERS;

  const handleStart = () => {
    const playerNames =
      mode === "solo"
        ? [names[0].trim() || strings.setupPlayerPlaceholder(1)]
        : trimmed;
    onStart(playerNames, targetScore, datasetKey);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 relative">
      <div className="absolute top-4 right-4 z-10">
        <MuteButton />
      </div>
      <div className="text-center mb-9">
        <span className="eyebrow text-brass block mb-1">Juego de preguntas</span>
        <h1 className="text-[clamp(2.25rem,11vw,3rem)] font-bold text-parchment tracking-tight leading-none">
          {strings.appTitle}
        </h1>
        <p className="text-parchment-dim text-sm max-w-xs mx-auto mt-3">
          {strings.tagline}
        </p>
      </div>

      <div className="w-full max-w-sm">
        <h2 className="eyebrow text-parchment-dim mb-2.5">{strings.setupMode}</h2>
        <div className="flex gap-2.5">
          {(["solo", "multi"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={segClass(mode === m, "text-base")}
            >
              {m === "solo" ? strings.modeSolo : strings.modeMulti}
            </button>
          ))}
        </div>

        <h2 className="eyebrow text-parchment-dim mt-8 mb-2.5">
          {mode === "solo" ? strings.setupSoloName : strings.setupPlayers}
        </h2>
        {mode === "solo" ? (
          <input
            value={names[0]}
            onChange={(e) => setName(0, e.target.value)}
            placeholder={strings.setupPlayerPlaceholder(1)}
            maxLength={20}
            className="field w-full"
          />
        ) : (
          <>
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
          </>
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
              className={segClass(targetScore === t, "text-2xl")}
            >
              {t}
            </button>
          ))}
        </div>

        <h2 className="eyebrow text-parchment-dim mt-8 mb-2.5">
          {strings.setupDataset}
        </h2>
        <div className="flex flex-wrap sm:flex-nowrap gap-2.5">
          {([...Object.keys(DATASETS), "all"] as DeckChoice[]).map((key) => (
            <button
              key={key}
              onClick={() => setDatasetKey(key)}
              aria-pressed={datasetKey === key}
              className={segClass(datasetKey === key, "text-sm sm:text-base")}
            >
              {DATASET_LABELS[key]}
            </button>
          ))}
        </div>

        <button
          onClick={handleStart}
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

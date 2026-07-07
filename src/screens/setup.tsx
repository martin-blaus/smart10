import { useState } from "react";
import { strings } from "../i18n/strings";
import { DATASETS } from "../../data";
import type { DeckChoice } from "../game/deck";
import { MuteButton } from "../components/mute_button";

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;
const TARGET_OPTIONS = [10, 15, 20];

const EMOJI_POOL = ["🦊", "🦉", "🐢", "🐺", "🦁", "🐸", "🦜", "🐙", "🦔", "🐴", "🦩", "🐳"];

const DATASET_LABELS: Record<DeckChoice, string> = {
  argentina: strings.datasetArgentina,
  general: strings.datasetGeneral,
  all: strings.datasetAll,
};

// Shared styling for the segmented option toggles (target score, dataset).
const segClass = (selected: boolean, size: string) =>
  `flex-grow flex-shrink basis-[calc(50%-5px)] sm:flex-1 min-h-14 rounded-2xl font-display ${size} font-bold transition-transform active:scale-[0.97] ` +
  (selected ? "btn-brass !px-0" : "panel text-parchment-dim");

interface Props {
  onStart: (
    players: { name: string; token: string }[],
    targetScore: number,
    deckChoice: DeckChoice,
    blitz: boolean,
  ) => void;
}

type Mode = "solo" | "multi";

export function SetupScreen({ onStart }: Props) {
  const [mode, setMode] = useState<Mode>("multi");
  const [names, setNames] = useState<string[]>(["", ""]);
  const [tokens, setTokens] = useState<string[]>(["🦊", "🦉"]);
  const [targetScore, setTargetScore] = useState(15);
  const [datasetKey, setDatasetKey] = useState<DeckChoice>("argentina");
  const [blitz, setBlitz] = useState(false);

  const setName = (i: number, value: string) =>
    setNames((prev) => prev.map((n, j) => (j === i ? value : n)));

  const addPlayer = () => {
    if (names.length < MAX_PLAYERS) {
      setNames((prev) => [...prev, ""]);
      setTokens((prev) => [...prev, EMOJI_POOL[prev.length % EMOJI_POOL.length]]);
    }
  };

  const removePlayer = (i: number) => {
    if (names.length > MIN_PLAYERS) {
      setNames((prev) => prev.filter((_, j) => j !== i));
      setTokens((prev) => prev.filter((_, j) => j !== i));
    }
  };

  const cycleToken = (i: number) => {
    setTokens((prev) =>
      prev.map((tok, j) => {
        if (j !== i) return tok;
        const idx = EMOJI_POOL.indexOf(tok);
        const nextIdx = (idx + 1) % EMOJI_POOL.length;
        return EMOJI_POOL[nextIdx];
      }),
    );
  };

  const trimmed = names.map((n, i) => n.trim() || strings.setupPlayerPlaceholder(i + 1));
  const canStart = mode === "solo" || names.length >= MIN_PLAYERS;

  const handleStart = () => {
    const playerNames =
      mode === "solo"
        ? [names[0].trim() || strings.setupPlayerPlaceholder(1)]
        : trimmed;
    const playersPayload = playerNames.map((name, i) => ({
      name,
      token: tokens[i] || "🦊",
    }));
    onStart(playersPayload, targetScore, datasetKey, blitz);
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
          <div className="flex gap-2 items-center w-full">
            <button
              onClick={() => cycleToken(0)}
              className="panel w-12 h-12 flex items-center justify-center text-xl shrink-0 rounded-2xl select-none cursor-pointer border border-brass/25 active:scale-95"
              aria-label="Cambiar avatar de emoji"
            >
              {tokens[0]}
            </button>
            <input
              value={names[0]}
              onChange={(e) => setName(0, e.target.value)}
              placeholder={strings.setupPlayerPlaceholder(1)}
              maxLength={20}
              className="field flex-1 min-w-0"
            />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {names.map((name, i) => (
                <div key={i} className="flex gap-2 items-center w-full">
                  <button
                    onClick={() => cycleToken(i)}
                    className="panel w-12 h-12 flex items-center justify-center text-xl shrink-0 rounded-2xl select-none cursor-pointer border border-brass/25 active:scale-95"
                    aria-label="Cambiar avatar de emoji"
                  >
                    {tokens[i]}
                  </button>
                  <input
                    value={name}
                    onChange={(e) => setName(i, e.target.value)}
                    placeholder={strings.setupPlayerPlaceholder(i + 1)}
                    maxLength={20}
                    className="field flex-1 min-w-0"
                  />
                  {names.length > MIN_PLAYERS && (
                    <button
                      onClick={() => removePlayer(i)}
                      className="btn-quiet w-12 h-12 !p-0 shrink-0 rounded-full flex items-center justify-center text-sm"
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

        <h2 className="eyebrow text-parchment-dim mt-8 mb-2.5">
          {strings.setupBlitz}
        </h2>
        <div className="flex gap-2.5">
          {[false, true].map((val) => (
            <button
              key={val ? "yes" : "no"}
              onClick={() => setBlitz(val)}
              aria-pressed={blitz === val}
              className={segClass(blitz === val, "text-base")}
            >
              {val ? strings.blitzActive : strings.blitzInactive}
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

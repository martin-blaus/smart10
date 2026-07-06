import { useEffect, useRef } from "react";
import { strings } from "../i18n/strings";

interface Props {
  playerName: string;
  playerToken?: string;
  lastResult: "correct" | "wrong" | null;
  onDone: () => void;
}

// Brief full-screen flash shown on a turn change: reports the result of the
// action that just happened and names the next player, then fades on its own.
// Tap anywhere to skip. Replaces the old blocking "hand off the device" dialog.
export function TurnTransition({ playerName, playerToken, lastResult, onDone }: Props) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => onDoneRef.current(), reduced ? 700 : 1300);
    return () => clearTimeout(t);
  }, []);

  const tint =
    lastResult === "correct"
      ? "bg-correct/25"
      : lastResult === "wrong"
        ? "bg-wrong/25"
        : "bg-[#122318]/95";

  return (
    <div
      onClick={() => onDoneRef.current()}
      role="status"
      aria-live="assertive"
      className={
        "fixed inset-0 z-50 backdrop-blur-sm flex flex-col items-center justify-center px-6 text-center fade-in [overscroll-behavior:contain] " +
        tint
      }
    >
      {lastResult && (
        <span
          className={
            "eyebrow text-2xl mb-6 " +
            (lastResult === "correct" ? "text-correct" : "text-wrong")
          }
        >
          {lastResult === "correct" ? strings.correctSo : strings.wrongSo}
        </span>
      )}
      <span className="eyebrow text-parchment-dim mb-3">{strings.turnNext}</span>
      <div className="flex flex-col items-center gap-2">
        {playerToken && (
          <span aria-hidden="true" className="select-none text-5xl">
            {playerToken}
          </span>
        )}
        <span className="font-display text-3xl font-bold text-parchment">
          {playerName}
        </span>
      </div>
    </div>
  );
}

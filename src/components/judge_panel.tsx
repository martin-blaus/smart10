import { useRef, useState } from "react";
import type { AnswerCardOption } from "../../data";
import { strings } from "../i18n/strings";

interface Props {
  option: AnswerCardOption; // the option being judged (subject + revealed answer)
  onVerdict: (correct: boolean) => void;
}

// Distance (px) a drag must travel to commit a verdict.
const THRESHOLD = 90;

const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// The judge step: a Tinder-style draggable card showing the revealed answer.
// Fling right = acertó (green), left = falló (red). The buttons below are a
// fallback for mouse / keyboard / assistive tech (swipe is touch-only).
export function JudgePanel({ option, onVerdict }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const committed = useRef(false);
  // Drag direction, only for tinting the side hints (-1 left, 0 none, 1 right).
  const [dir, setDir] = useState<-1 | 0 | 1>(0);

  const setTransform = (dx: number) => {
    const el = cardRef.current;
    if (el) el.style.transform = `translateX(${dx}px) rotate(${dx * 0.04}deg)`;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (committed.current) return;
    startX.current = e.clientX;
    const el = cardRef.current;
    if (el) {
      el.style.transition = "none";
      el.setPointerCapture(e.pointerId);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    setTransform(dx);
    setDir(dx > 20 ? 1 : dx < -20 ? -1 : 0);
  };

  const commit = (correct: boolean) => {
    if (committed.current) return;
    committed.current = true;
    const el = cardRef.current;
    if (el && !reducedMotion()) {
      el.style.transition = "transform 0.22s ease-out, opacity 0.22s ease-out";
      el.style.transform = `translateX(${correct ? 700 : -700}px) rotate(${correct ? 30 : -30}deg)`;
      el.style.opacity = "0";
      window.setTimeout(() => onVerdict(correct), 200);
    } else {
      onVerdict(correct);
    }
  };

  const springBack = () => {
    const el = cardRef.current;
    if (el) {
      if (!reducedMotion()) el.style.transition = "transform 0.2s ease-out";
      el.style.transform = "translateX(0) rotate(0deg)";
    }
    setDir(0);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) >= THRESHOLD) commit(dx > 0);
    else springBack();
  };

  const onPointerCancel = () => {
    startX.current = null;
    springBack();
  };

  const border =
    dir === 1
      ? "border-correct/70"
      : dir === -1
        ? "border-wrong/70"
        : "border-[color:var(--color-brass-deep)]/40";

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-[#122318] via-[#122318]/95 to-transparent fade-in">
      <div className="relative w-full max-w-md mx-auto">
        {/* Directional hints, brighter as the card is dragged toward each side. */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 z-10 eyebrow text-wrong text-lg transition-opacity"
          style={{ opacity: dir === -1 ? 1 : 0.25 }}
        >
          ← {strings.judgeSwipeLeft}
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 z-10 eyebrow text-correct text-lg transition-opacity"
          style={{ opacity: dir === 1 ? 1 : 0.25 }}
        >
          {strings.judgeSwipeRight} →
        </span>

        <div
          ref={cardRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          style={{ touchAction: "none" }}
          className={"panel p-4 text-center cursor-grab active:cursor-grabbing border " + border}
        >
          <span className="eyebrow text-parchment-dim block mb-1">
            {strings.judgeAnswerWas}
          </span>
          <p className="text-parchment-dim text-sm">{option.text}</p>
          <p className="font-display text-2xl font-bold text-brass text-balance">
            {option.answer}
          </p>
          {option.info && (
            <p className="text-xs text-parchment-dim mt-0.5">{option.info}</p>
          )}
          <p className="text-parchment-dim text-sm mt-2">{strings.judgePrompt}</p>
        </div>

        <div className="flex gap-2.5 mt-3">
          <button
            onClick={() => commit(false)}
            className="btn-quiet flex-1 text-base"
          >
            {strings.judgeWrong}
          </button>
          <button
            onClick={() => commit(true)}
            className="btn-brass flex-1 text-base"
          >
            {strings.judgeCorrect}
          </button>
        </div>
      </div>
    </div>
  );
}

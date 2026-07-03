import { strings } from "../i18n/strings";

interface Props {
  playerName: string;
  playerToken?: string;
  lastResult: "correct" | "wrong" | null;
  onReady: () => void;
}

// Full-screen blocking cue shown when the turn moves to another player, so the
// next player doesn't see the previous reveal. Also reports the result of the
// action that just happened, so the player who acted sees it before handing off.
export function HandoffOverlay({ playerName, playerToken, lastResult, onReady }: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#122318]/95 backdrop-blur-sm flex flex-col items-center justify-center px-6 text-center fade-in [overscroll-behavior:contain]"
    >
      {lastResult && (
        <span
          aria-live="assertive"
          className={
            "eyebrow mb-5 " +
            (lastResult === "correct" ? "text-correct" : "text-wrong")
          }
        >
          {lastResult === "correct" ? strings.correctSo : strings.wrongSo}
        </span>
      )}
      {/* A card resting face-down on the table. */}
      <div className="w-24 h-32 rounded-xl mb-7 card-stock flex items-center justify-center rotate-[-4deg]">
        <span className="font-display text-2xl font-bold text-brass-deep">S10</span>
      </div>
      <h2 className="font-display text-3xl font-bold text-parchment mb-2 max-w-xs flex flex-col items-center justify-center gap-1.5">
        {playerToken && <span aria-hidden="true" className="select-none text-4xl">{playerToken}</span>}
        <span>{strings.handoffTitle(playerName)}</span>
      </h2>
      <p className="text-parchment-dim mb-8">{strings.handoffSubtitle}</p>
      <button onClick={onReady} className="btn-brass text-lg px-10">
        {strings.handoffReady}
      </button>
    </div>
  );
}

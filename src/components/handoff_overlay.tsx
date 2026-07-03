import { strings } from "../i18n/strings";

interface Props {
  playerName: string;
  lastResult: "correct" | "wrong" | null;
  onReady: () => void;
}

// Full-screen blocking cue shown when the turn moves to another player, so the
// next player doesn't see the previous reveal. Also reports the result of the
// action that just happened, so the player who acted sees it before handing off.
export function HandoffOverlay({ playerName, lastResult, onReady }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur flex flex-col items-center justify-center px-6 text-center fade-in">
      {lastResult && (
        <span
          className={
            "text-xl font-black mb-4 " +
            (lastResult === "correct" ? "text-success" : "text-danger")
          }
        >
          {lastResult === "correct" ? strings.correctSo : strings.wrongSo}
        </span>
      )}
      <span className="text-5xl mb-6" aria-hidden>
        📱
      </span>
      <h2 className="text-2xl font-black text-text-primary mb-2">
        {strings.handoffTitle(playerName)}
      </h2>
      <p className="text-text-secondary mb-8">{strings.handoffSubtitle}</p>
      <button onClick={onReady} className="btn-primary text-base px-8">
        {strings.handoffReady}
      </button>
    </div>
  );
}

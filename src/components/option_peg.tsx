import type { CardOption } from "../../data";

interface Props {
  option: CardOption;
  number: number; // 1-based position on the card
  revealed: boolean;
  disabled: boolean;
  arc: number; // horizontal nudge (px) to follow the dial's oval curve
  onTap: () => void;
}

// One answer on the dial: a numbered brass peg + its label. On reveal it flips
// to green (correct) or red (wrong); the peg shows ✓ / ✗ in place of the number.
export function OptionPeg({ option, number, revealed, disabled, arc, onTap }: Props) {
  const shell =
    "flex items-center gap-2.5 rounded-full pl-1.5 pr-3 py-1.5 text-left border min-h-12 w-full";
  const disc =
    "grid place-items-center shrink-0 w-9 h-9 rounded-full font-display font-bold text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]";

  // Arc offset lives on this wrapper so it never collides with the flip /
  // press transforms applied to the peg itself.
  return (
    <div className="w-full" style={{ transform: `translateX(${arc}px)` }}>
      {revealed ? (
        <div
          className={
            shell +
            " peg-flip " +
            (option.correct
              ? "border-correct/40 bg-correct-soft"
              : "border-wrong/40 bg-wrong-soft")
          }
        >
          <span
            className={disc + " text-white " + (option.correct ? "bg-correct" : "bg-wrong")}
            aria-hidden
          >
            {option.correct ? "✓" : "✗"}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-ink leading-tight line-clamp-3">
              {option.text}
            </span>
            {option.info && (
              <span className="block text-[0.7rem] text-ink-soft leading-tight">
                {option.info}
              </span>
            )}
          </span>
        </div>
      ) : (
        <button
          onClick={onTap}
          disabled={disabled}
          className={
            shell +
            " bg-cream-hi border-[color:var(--color-cream-edge)] font-semibold" +
            " shadow-[0_1px_3px_rgba(90,60,10,0.18)] transition-[filter,scale]" +
            " hover:brightness-[1.02] active:scale-[0.97] disabled:opacity-45 disabled:active:scale-100"
          }
        >
          <span
            className={
              disc +
              " bg-gradient-to-b from-brass-hi to-[color:var(--color-brass-deep)] text-brass-ink"
            }
          >
            {number}
          </span>
          <span className="min-w-0 text-sm text-ink leading-tight line-clamp-3">
            {option.text}
          </span>
        </button>
      )}
    </div>
  );
}

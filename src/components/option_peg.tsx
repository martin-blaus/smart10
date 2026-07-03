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
    "flex items-center gap-2.5 rounded-full pl-1.5 pr-3 py-1.5 text-left border transition-[transform,filter] min-h-12 w-full";
  const disc =
    "grid place-items-center shrink-0 w-9 h-9 rounded-full font-display font-bold text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]";
  const style = { transform: `translateX(${arc}px)` };

  if (revealed) {
    const correct = option.correct;
    return (
      <div
        style={style}
        className={
          shell +
          " fade-in " +
          (correct
            ? "border-correct/40 bg-correct-soft"
            : "border-wrong/40 bg-wrong-soft")
        }
      >
        <span
          className={
            disc +
            " text-white " +
            (correct ? "bg-correct" : "bg-wrong")
          }
          aria-hidden
        >
          {correct ? "✓" : "✗"}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-bold text-ink leading-tight line-clamp-2">
            {option.text}
          </span>
          {option.info && (
            <span className="block text-[0.7rem] text-ink-soft leading-tight">
              {option.info}
            </span>
          )}
        </span>
      </div>
    );
  }

  return (
    <button
      style={style}
      onClick={onTap}
      disabled={disabled}
      className={
        shell +
        " bg-[#fbf6ea] border-[color:var(--color-cream-edge)] font-semibold" +
        " shadow-[0_1px_3px_rgba(90,60,10,0.18)] hover:brightness-[1.02]" +
        " active:scale-[0.97] disabled:opacity-45 disabled:active:scale-100"
      }
    >
      <span
        className={
          disc +
          " bg-gradient-to-b from-[#f0c869] to-[color:var(--color-brass-deep)] text-brass-ink"
        }
      >
        {number}
      </span>
      <span className="min-w-0 text-sm text-ink leading-tight line-clamp-2">
        {option.text}
      </span>
    </button>
  );
}

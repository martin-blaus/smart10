import type { CardOption } from "../../data";
import { isAnswerCardOption } from "../../data";

interface Props {
  option: CardOption;
  number: number; // 1-based position on the card
  revealed: boolean;
  disabled: boolean;
  arc: number; // horizontal nudge (px) to follow the dial's oval curve
  onTap: () => void;
  justRevealed?: boolean;
  // Answer-card options only: the table's verdict once delivered. `undefined`
  // means not yet judged (or never tapped) → the peg reveals neutrally.
  verdict?: boolean;
}

// One answer on the dial: a numbered brass peg + its label. On reveal a boolean
// option flips to green (correct) or red (wrong) with ✓ / ✗; an answer option
// shows its hidden answer — colored by the table's verdict, or neutral brass
// until judged.
export function OptionPeg({
  option,
  number,
  revealed,
  disabled,
  arc,
  onTap,
  justRevealed,
  verdict,
}: Props) {
  const shell =
    "flex items-center gap-2.5 rounded-full pl-1.5 pr-3 py-1.5 text-left border min-h-12 w-full";
  const disc =
    "grid place-items-center shrink-0 w-9 h-9 rounded-full font-display font-bold text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]";
  // Brass number disc, shared by the unrevealed peg and the neutral (unjudged)
  // reveal of an answer option.
  const numberDisc =
    disc + " bg-gradient-to-b from-brass-hi to-[color:var(--color-brass-deep)] text-brass-ink";

  // The color outcome for the revealed peg: a boolean option is right/wrong on
  // its own; an answer option follows the verdict, or is neutral (null) until
  // it has been judged.
  const outcome: boolean | null = isAnswerCardOption(option)
    ? (verdict ?? null)
    : option.correct;

  const shellColor =
    outcome === null
      ? "border-brass/40 bg-cream-hi"
      : outcome
        ? "border-correct/40 bg-correct-soft"
        : "border-wrong/40 bg-wrong-soft";

  // Arc offset lives on this wrapper so it never collides with the flip /
  // press transforms applied to the peg itself.
  return (
    <div className="w-full relative" style={{ transform: `translateX(${arc}px)` }}>
      {revealed ? (
        <div className={shell + " peg-flip relative overflow-hidden " + shellColor}>
          {justRevealed && (
            <div
              className="absolute inset-0 bg-cream-hi border border-[color:var(--color-cream-edge)] rounded-full z-10 flex items-center gap-2.5 pl-1.5 suspense-cover pointer-events-none"
              aria-hidden
            >
              <span className="grid place-items-center shrink-0 w-9 h-9 rounded-full font-display font-bold text-sm bg-gradient-to-b from-brass-hi to-[color:var(--color-brass-deep)] text-brass-ink">
                {number}
              </span>
              <span className="min-w-0 text-sm text-ink leading-tight line-clamp-3">
                {option.text}
              </span>
            </div>
          )}
          {outcome === null ? (
            <span className={numberDisc} aria-hidden>
              {number}
            </span>
          ) : (
            <span
              className={disc + " text-white " + (outcome ? "bg-correct" : "bg-wrong")}
              aria-hidden
            >
              {outcome ? "✓" : "✗"}
            </span>
          )}
          <span className="min-w-0">
            <span className="block text-sm font-bold text-ink leading-tight line-clamp-3">
              {option.text}
            </span>
            {isAnswerCardOption(option) && (
              <span className="block text-[0.8rem] font-semibold text-brass-deep leading-tight">
                {option.answer}
              </span>
            )}
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
          <span className={numberDisc}>{number}</span>
          <span className="min-w-0 text-sm text-ink leading-tight line-clamp-3">
            {option.text}
          </span>
        </button>
      )}
    </div>
  );
}

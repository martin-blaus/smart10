import type { CardOption } from "../../data";

interface Props {
  option: CardOption;
  revealed: boolean;
  disabled: boolean;
  onTap: () => void;
}

export function OptionPeg({ option, revealed, disabled, onTap }: Props) {
  const base =
    "relative min-h-16 rounded-xl border p-3 text-left transition-colors flex flex-col justify-center";

  if (revealed) {
    const tone = option.correct
      ? "border-correct/50 bg-correct-soft text-ink"
      : "border-wrong/50 bg-wrong-soft text-ink";
    return (
      <div className={`${base} ${tone} fade-in`}>
        <span className="flex items-center gap-2 font-bold">
          <span className={option.correct ? "text-correct" : "text-wrong"} aria-hidden>
            {option.correct ? "✓" : "✗"}
          </span>
          <span>{option.text}</span>
        </span>
        {option.info && (
          <span className="text-xs text-ink-soft mt-0.5">{option.info}</span>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={onTap}
      disabled={disabled}
      className={`${base} card-stock font-semibold hover:brightness-[1.03] active:scale-[0.98] disabled:opacity-50`}
    >
      {option.text}
    </button>
  );
}

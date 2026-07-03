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
      ? "border-success bg-success-bg text-text-primary"
      : "border-danger bg-danger-bg text-text-primary";
    return (
      <div className={`${base} ${tone}`}>
        <span className="flex items-center gap-2 font-semibold">
          <span aria-hidden>{option.correct ? "✓" : "✗"}</span>
          <span>{option.text}</span>
        </span>
        {option.info && (
          <span className="text-xs text-text-secondary mt-0.5">
            {option.info}
          </span>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={onTap}
      disabled={disabled}
      className={`${base} border-border bg-bg-card text-text-primary font-medium hover:border-brand active:scale-[0.98] disabled:opacity-50`}
    >
      {option.text}
    </button>
  );
}

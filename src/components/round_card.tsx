import type { Card } from "../../data";
import { OptionPeg } from "./option_peg";

interface Props {
  card: Card;
  revealed: number[];
  revealAll?: boolean;
  disabled?: boolean;
  onTap?: (optionIndex: number) => void;
}

// Outer rows sit closer to center, the middle row bulges out — makes the two
// columns of pegs follow the oval of the dial. Row is 0..4 within a column.
function arcOffset(row: number, side: "left" | "right"): number {
  const fromCenter = 2 - Math.abs(row - 2); // 0,1,2,1,0
  const magnitude = fromCenter * 7;
  return side === "left" ? -magnitude : magnitude;
}

// The signature "dial": a cream, brass-rimmed card with the question at the top
// and the 10 numbered answer pegs arranged in two arced columns around it.
export function RoundCard({ card, revealed, revealAll, disabled, onTap }: Props) {
  const left = card.options.slice(0, 5);
  const right = card.options.slice(5, 10);

  const renderPeg = (option: Card["options"][number], index: number) => {
    const row = index % 5;
    const side = index < 5 ? "left" : "right";
    return (
      <OptionPeg
        key={index}
        option={option}
        number={index + 1}
        revealed={revealAll || revealed.includes(index)}
        disabled={disabled ?? false}
        arc={arcOffset(row, side)}
        onTap={() => onTap?.(index)}
      />
    );
  };

  return (
    <div className="dial px-3 py-6 sm:px-6">
      <div className="text-center px-4 mb-5">
        <span className="eyebrow text-brass-deep">{card.category}</span>
        <h1 className="font-display text-xl sm:text-2xl font-semibold text-ink mt-1 leading-snug text-balance">
          {card.question}
        </h1>
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-2.5">
        <div className="flex flex-col gap-2.5">
          {left.map((o, i) => renderPeg(o, i))}
        </div>
        <div className="flex flex-col gap-2.5">
          {right.map((o, i) => renderPeg(o, i + 5))}
        </div>
      </div>
    </div>
  );
}

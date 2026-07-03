import type { Card } from "../../data";
import { OptionPeg } from "./option_peg";

interface Props {
  card: Card;
  revealed: number[];
  revealAll?: boolean;
  disabled?: boolean;
  // Heading level for the question. The screen's main heading is elsewhere at
  // round end, so the dial renders the question as plain text there.
  questionAs?: "h1" | "p";
  onTap?: (optionIndex: number) => void;
  justRevealedIndex?: number | null;
}

// Each column of 5 pegs traces one side of an ellipse: the middle peg bows out
// the most, the top and bottom pegs pull in toward the poles. Together the two
// columns form the oval of the dial. `row` is 0..4 within a column.
const ELLIPSE_AMPLITUDE = 20; // px the middle peg bows outward
// The 5 bow magnitudes are fixed, so compute them once instead of per render.
const ARC_MAGNITUDE = [0, 1, 2, 3, 4].map((row) => {
  const t = (row - 2) / 2; // -1..1
  return ELLIPSE_AMPLITUDE * Math.sqrt(1 - t * t);
});
function arcOffset(row: number, side: "left" | "right"): number {
  return side === "left" ? -ARC_MAGNITUDE[row] : ARC_MAGNITUDE[row];
}

// The signature "dial": a cream, brass-rimmed card with the question in the
// center and the 10 numbered answer pegs arranged in an oval around it.
export function RoundCard({
  card,
  revealed,
  revealAll,
  disabled,
  questionAs = "h1",
  onTap,
  justRevealedIndex,
}: Props) {
  const left = card.options.slice(0, 5);
  const right = card.options.slice(5, 10);
  const Question = questionAs;

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
        justRevealed={!revealAll && justRevealedIndex === index}
      />
    );
  };

  return (
    <div className="dial px-6 py-8 sm:px-10">
      <div className="text-center mb-7">
        <span className="eyebrow text-brass-deep">{card.category}</span>
        <Question className="font-display text-2xl sm:text-3xl font-semibold text-ink mt-1 leading-snug text-balance">
          {card.question}
        </Question>
      </div>
      <div className="grid grid-cols-2 gap-x-1 gap-y-4 sm:gap-x-4">
        <div className="flex flex-col gap-4">
          {left.map((o, i) => renderPeg(o, i))}
        </div>
        <div className="flex flex-col gap-4">
          {right.map((o, i) => renderPeg(o, i + 5))}
        </div>
      </div>
    </div>
  );
}

import { strings } from "../i18n/strings";

interface Props {
  answer: string; // the revealed true answer
  onVerdict: (correct: boolean) => void;
}

// Non-modal bottom panel shown while an answer-card option awaits the table's
// verdict. The revealed peg stays visible above so players can compare the true
// answer with what was said out loud.
export function JudgePanel({ answer, onVerdict }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-[#122318] via-[#122318]/95 to-transparent fade-in">
      <div className="panel w-full max-w-md mx-auto p-4 text-center">
        <span className="eyebrow text-parchment-dim block mb-1">
          {strings.judgeAnswerWas}
        </span>
        <p className="font-display text-xl font-bold text-brass mb-1 text-balance">
          {answer}
        </p>
        <p className="text-parchment-dim text-sm mb-4">{strings.judgePrompt}</p>
        <div className="flex gap-2.5">
          <button
            onClick={() => onVerdict(false)}
            className="btn-quiet flex-1 text-base"
          >
            {strings.judgeWrong}
          </button>
          <button
            onClick={() => onVerdict(true)}
            className="btn-brass flex-1 text-base"
          >
            {strings.judgeCorrect}
          </button>
        </div>
      </div>
    </div>
  );
}

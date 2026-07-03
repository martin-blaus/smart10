import { useEffect, useState } from "react";
import type { Action, GameState } from "../types";
import { getCard } from "../game/deck";
import { strings } from "../i18n/strings";
import { OptionPeg } from "../components/option_peg";
import { TurnBanner } from "../components/turn_banner";
import { Scoreboard } from "../components/scoreboard";
import { HandoffOverlay } from "../components/handoff_overlay";

interface Props {
  state: GameState;
  dispatch: (action: Action) => void;
}

type LastResult = "correct" | "wrong" | null;

export function GameScreen({ state, dispatch }: Props) {
  const card = getCard(state.currentCardId);
  const [handoffPlayer, setHandoffPlayer] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<LastResult>(null);

  // Whenever the active player changes during play, block the screen so the
  // device can be handed over without the next player seeing the reveal.
  useEffect(() => {
    if (state.phase === "playing") {
      setHandoffPlayer(state.currentPlayerIndex);
    } else {
      setHandoffPlayer(null);
    }
  }, [state.phase, state.currentPlayerIndex, state.currentCardId]);

  if (!card) return null;

  const current = state.players[state.currentPlayerIndex];

  const handleTap = (optionIndex: number) => {
    const correct = card.options[optionIndex]?.correct;
    setLastResult(correct ? "correct" : "wrong");
    dispatch({ type: "TAP_OPTION", optionIndex });
  };

  const handlePass = () => {
    if (current.pendingPoints === 0 && !confirm(strings.passNoPointsConfirm)) {
      return;
    }
    setLastResult(null);
    dispatch({ type: "PASS" });
  };

  const handleNextCard = () => {
    setLastResult(null);
    dispatch({ type: "NEXT_ROUND" });
  };

  if (state.phase === "roundEnd") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 gap-6">
        <h2 className="text-2xl font-black text-text-primary">
          {strings.roundEndTitle}
        </h2>
        <div className="w-full max-w-md">
          <Scoreboard
            players={state.players}
            currentPlayerIndex={-1}
            targetScore={state.targetScore}
          />
        </div>
        <button onClick={handleNextCard} className="btn-primary text-base px-8">
          {strings.nextCard}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-4 max-w-2xl mx-auto flex flex-col gap-3">
      <TurnBanner player={current} />

      <div className="rounded-xl bg-bg-secondary border border-border p-4">
        <span className="text-xs uppercase tracking-wide text-brand font-semibold">
          {card.category}
        </span>
        <h1 className="text-lg font-bold text-text-primary mt-1 leading-snug">
          {card.question}
        </h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {card.options.map((option, i) => (
          <OptionPeg
            key={i}
            option={option}
            revealed={state.revealedOptions.includes(i)}
            disabled={handoffPlayer !== null}
            onTap={() => handleTap(i)}
          />
        ))}
      </div>

      <button onClick={handlePass} className="btn-secondary text-base mt-1">
        {strings.pass}
      </button>

      <Scoreboard
        players={state.players}
        currentPlayerIndex={state.currentPlayerIndex}
        targetScore={state.targetScore}
      />

      {handoffPlayer !== null && (
        <HandoffOverlay
          playerName={state.players[handoffPlayer].name}
          lastResult={lastResult}
          onReady={() => {
            setLastResult(null);
            setHandoffPlayer(null);
          }}
        />
      )}
    </div>
  );
}

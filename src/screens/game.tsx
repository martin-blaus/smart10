import { useEffect, useState } from "react";
import type { Action, GameState } from "../types";
import { getCard } from "../game/deck";
import { strings } from "../i18n/strings";
import { RoundCard } from "../components/round_card";
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
    // A passed/banked player keeps their round total in pendingPoints; a failed
    // player has it zeroed. Use it to show what happened this round.
    return (
      <div className="min-h-screen flex flex-col items-center px-4 py-8 gap-6 fade-in max-w-md mx-auto">
        <h1 className="font-display text-3xl font-bold text-parchment mt-2">
          {strings.roundEndTitle}
        </h1>
        <div className="w-full">
          <span className="eyebrow text-parchment-dim block mb-2 text-center">
            {strings.roundEndAnswers}
          </span>
          <RoundCard
            card={card}
            revealed={state.revealedOptions}
            revealAll
            questionAs="p"
          />
        </div>
        <ul className="w-full flex flex-col gap-2">
          {state.players.map((p, i) => {
            const failed = p.roundStatus === "failed";
            return (
              <li
                key={i}
                className="flex items-center justify-between panel px-4 py-3"
              >
                <span className="text-parchment truncate">{p.name}</span>
                <span className="flex items-center gap-3 shrink-0">
                  <span
                    className={
                      "text-sm font-semibold " +
                      (failed ? "text-wrong" : "text-correct")
                    }
                  >
                    {failed
                      ? strings.statusFailed
                      : `${strings.statusPassed} +${p.pendingPoints}`}
                  </span>
                  <span className="font-display font-bold tabular-nums text-parchment text-xl">
                    {p.score}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
        <button onClick={handleNextCard} className="btn-brass text-lg px-10">
          {strings.nextCard}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-4 max-w-2xl mx-auto flex flex-col gap-3">
      <TurnBanner player={current} />

      <RoundCard
        card={card}
        revealed={state.revealedOptions}
        disabled={handoffPlayer !== null}
        onTap={handleTap}
      />

      <button onClick={handlePass} className="btn-quiet text-base mt-1">
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

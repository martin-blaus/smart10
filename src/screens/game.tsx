import { useEffect, useState, useRef } from "react";
import type { Action, GameState } from "../types";
import { getCard } from "../game/deck";
import { strings } from "../i18n/strings";
import { RoundCard } from "../components/round_card";
import { TurnBanner } from "../components/turn_banner";
import { Scoreboard } from "../components/scoreboard";
import { HandoffOverlay } from "../components/handoff_overlay";
import { ConfirmDialog } from "../components/confirm_dialog";
import { sounds } from "../sounds";
import { MuteButton } from "../components/mute_button";
import { useWakeLock } from "../hooks/useWakeLock";

interface Props {
  state: GameState;
  dispatch: (action: Action) => void;
}

type LastResult = "correct" | "wrong" | null;

export function GameScreen({ state, dispatch }: Props) {
  useWakeLock(state.phase === "playing" || state.phase === "roundEnd");
  const card = getCard(state.currentCardId);
  const [handoffPlayer, setHandoffPlayer] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<LastResult>(null);
  const [confirmingPass, setConfirmingPass] = useState(false);

  const [justRevealedIndex, setJustRevealedIndex] = useState<number | null>(null);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handoffTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tapOccurredRef = useRef<boolean>(false);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      if (handoffTimeoutRef.current) clearTimeout(handoffTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (state.phase === "roundEnd") {
      sounds.roundEnd();
    }
  }, [state.phase]);

  // Whenever the active player changes during play, block the screen so the
  // device can be handed over without the next player seeing the reveal. In
  // solo mode there is no one to hand off to, so skip it.
  useEffect(() => {
    if (handoffTimeoutRef.current) clearTimeout(handoffTimeoutRef.current);

    if (state.phase === "playing" && state.players.length > 1) {
      const targetPlayerIndex = state.currentPlayerIndex;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (tapOccurredRef.current) {
        tapOccurredRef.current = false;
        if (reducedMotion) {
          setHandoffPlayer(targetPlayerIndex);
          setJustRevealedIndex(null);
        } else {
          handoffTimeoutRef.current = setTimeout(() => {
            setHandoffPlayer(targetPlayerIndex);
            setJustRevealedIndex(null); // Clear suspense flag when handoff overlays
          }, 900);
        }
      } else {
        setHandoffPlayer(targetPlayerIndex);
        setJustRevealedIndex(null);
      }
    } else {
      setHandoffPlayer(null);
      setJustRevealedIndex(null);
    }
  }, [
    state.phase,
    state.currentPlayerIndex,
    state.currentCardId,
    state.players.length,
  ]);

  if (!card) return null;

  const current = state.players[state.currentPlayerIndex];

  const handleTap = (optionIndex: number) => {
    sounds.tap();
    setJustRevealedIndex(optionIndex);
    tapOccurredRef.current = true;

    const correct = card.options[optionIndex]?.correct;
    setLastResult(correct ? "correct" : "wrong");

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);

    if (reducedMotion) {
      if (correct) {
        sounds.correct();
      } else {
        sounds.wrong();
      }
      dispatch({ type: "TAP_OPTION", optionIndex });
    } else {
      // Play correct/wrong sound at the end of the suspense flip (400ms)
      tapTimeoutRef.current = setTimeout(() => {
        if (correct) {
          sounds.correct();
        } else {
          sounds.wrong();
        }
      }, 400);

      dispatch({ type: "TAP_OPTION", optionIndex });
    }
  };

  const doPass = () => {
    sounds.bank();
    setLastResult(null);
    dispatch({ type: "PASS" });
  };

  const handlePass = () => {
    // Planting with points banked is unambiguous; confirm only the wasteful case.
    if (current.pendingPoints === 0) {
      setConfirmingPass(true);
      return;
    }
    doPass();
  };

  const handleNextCard = () => {
    setLastResult(null);
    dispatch({ type: "NEXT_ROUND" });
  };

  if (state.phase === "roundEnd") {
    // A passed/banked player keeps their round total in pendingPoints; a failed
    // player has it zeroed. Use it to show what happened this round.
    return (
      <div className="min-h-screen flex flex-col items-center px-4 py-8 gap-6 fade-in max-w-md mx-auto relative">
        <div className="absolute top-4 right-4 z-10">
          <MuteButton />
        </div>
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
      <div className="flex gap-2 items-center w-full">
        <div className="panel px-3 py-1 flex items-center justify-center shrink-0 min-h-12">
          <span className="eyebrow text-brass text-sm tracking-wider font-semibold uppercase">
            Carta {state.usedCardIds.length}
          </span>
        </div>
        <div className="flex-grow min-w-0">
          <TurnBanner player={current} />
        </div>
        <MuteButton />
      </div>

      <RoundCard
        card={card}
        revealed={state.revealedOptions}
        disabled={handoffPlayer !== null}
        onTap={handleTap}
        justRevealedIndex={justRevealedIndex}
      />

      <button onClick={handlePass} className="btn-token text-lg mt-1">
        {strings.pass}
      </button>

      {/* Inline by default; a fixed HUD panel in the top-right on wide screens
          (xl+, where it clears the centered game column). */}
      <div className="xl:fixed xl:top-4 xl:right-4 xl:z-40 xl:w-72">
        <Scoreboard
          players={state.players}
          currentPlayerIndex={state.currentPlayerIndex}
          targetScore={state.targetScore}
        />
      </div>

      {confirmingPass && (
        <ConfirmDialog
          message={strings.passNoPointsConfirm}
          confirmLabel={strings.passConfirmYes}
          cancelLabel={strings.passConfirmNo}
          onConfirm={() => {
            setConfirmingPass(false);
            doPass();
          }}
          onCancel={() => setConfirmingPass(false)}
        />
      )}

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

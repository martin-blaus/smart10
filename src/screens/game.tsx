import { useEffect, useState, useRef, useCallback } from "react";
import type { Action, GameState } from "../types";
import { getCard } from "../game/deck";
import { isAnswerCard, isAnswerCardOption } from "../../data";
import { strings } from "../i18n/strings";
import { RoundCard } from "../components/round_card";
import { TurnBanner } from "../components/turn_banner";
import { Scoreboard } from "../components/scoreboard";
import { HandoffOverlay } from "../components/handoff_overlay";
import { JudgePanel } from "../components/judge_panel";
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

  // Flying score dots state
  interface FlyingDot {
    id: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    delay: number;
  }
  const [flyingDots, setFlyingDots] = useState<FlyingDot[]>([]);
  const [animatingBanking, setAnimatingBanking] = useState(false);

  const animateFlyingDots = (
    srcId: string,
    destId: string,
    count: number,
    baseDelay = 0,
  ) => {
    const srcEl = document.getElementById(srcId);
    const destEl = document.getElementById(destId);
    if (!srcEl || !destEl || count <= 0) return;

    const srcRect = srcEl.getBoundingClientRect();
    const destRect = destEl.getBoundingClientRect();

    const startX = srcRect.left + srcRect.width / 2;
    const startY = srcRect.top + srcRect.height / 2;
    const endX = destRect.left + destRect.width / 2;
    const endY = destRect.top + destRect.height / 2;

    const newDots = Array.from({ length: count }).map((_, i) => ({
      id: Math.random() + i,
      startX,
      startY,
      endX,
      endY,
      delay: baseDelay + i * 120,
    }));

    setFlyingDots((prev) => [...prev, ...newDots]);
  };

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

  // Blitz mode timer hooks
  const [timeLeft, setTimeLeft] = useState(15);

  const handleTimeout = useCallback(() => {
    sounds.wrong();
    dispatch({ type: "TIME_OUT" });
  }, [dispatch]);

  useEffect(() => {
    if (
      state.blitz &&
      state.phase === "playing" &&
      handoffPlayer === null &&
      !confirmingPass &&
      !animatingBanking &&
      justRevealedIndex === null &&
      state.judgingOptionIndex === null
    ) {
      setTimeLeft(15);
    }
  }, [
    state.currentPlayerIndex,
    state.currentCardId,
    handoffPlayer,
    confirmingPass,
    animatingBanking,
    justRevealedIndex,
    state.judgingOptionIndex,
    state.blitz,
    state.phase,
  ]);

  useEffect(() => {
    if (!state.blitz || state.phase !== "playing") return;
    if (handoffPlayer !== null || confirmingPass || animatingBanking || justRevealedIndex !== null) return;
    if (state.judgingOptionIndex !== null) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    state.blitz,
    state.phase,
    handoffPlayer,
    confirmingPass,
    animatingBanking,
    justRevealedIndex,
    state.judgingOptionIndex,
    state.currentPlayerIndex,
    handleTimeout,
  ]);

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

  const judgingOption =
    state.judgingOptionIndex !== null
      ? card.options[state.judgingOptionIndex]
      : null;
  const judgingAnswer =
    judgingOption && isAnswerCardOption(judgingOption) ? judgingOption.answer : null;

  const handleTap = (optionIndex: number) => {
    if (animatingBanking) return;
    sounds.tap();
    setJustRevealedIndex(optionIndex);

    // Answer cards: reveal the true answer and wait for the table's verdict.
    // Scoring, the result flash, and the handoff all happen on JUDGE_ANSWER.
    if (isAnswerCard(card)) {
      dispatch({ type: "TAP_OPTION", optionIndex });
      return;
    }

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

  // The table's decision on a spoken answer. Mirrors a boolean tap's aftermath:
  // flash the result and hand off to the next player on the resulting turn.
  const handleVerdict = (correct: boolean) => {
    setJustRevealedIndex(null);
    setLastResult(correct ? "correct" : "wrong");
    tapOccurredRef.current = true;
    if (correct) {
      sounds.correct();
    } else {
      sounds.wrong();
    }
    dispatch({ type: "JUDGE_ANSWER", correct });
  };

  const doPass = () => {
    sounds.bank();
    setLastResult(null);
    dispatch({ type: "PASS" });
  };

  const handlePass = () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (current.pendingPoints === 0) {
      setConfirmingPass(true);
      return;
    }

    if (reducedMotion) {
      doPass();
      return;
    }

    setAnimatingBanking(true);
    sounds.bankPointFly(current.pendingPoints);
    animateFlyingDots("pass-btn", "scoreboard-panel", current.pendingPoints);

    setTimeout(() => {
      doPass();
      setFlyingDots([]);
      setAnimatingBanking(false);
    }, current.pendingPoints * 120 + 500);
  };

  const handleNextCard = () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const activeBankers = state.players.filter((p) => p.roundStatus !== "failed" && p.pendingPoints > 0);

    if (reducedMotion || activeBankers.length === 0) {
      setLastResult(null);
      dispatch({ type: "NEXT_ROUND" });
      return;
    }

    setAnimatingBanking(true);
    let maxCount = 0;

    state.players.forEach((p, idx) => {
      if (p.roundStatus !== "failed" && p.pendingPoints > 0) {
        maxCount = Math.max(maxCount, p.pendingPoints);
        sounds.bankPointFly(p.pendingPoints);
        animateFlyingDots(`player-pending-${idx}`, `player-score-${idx}`, p.pendingPoints);
      }
    });

    setTimeout(() => {
      setLastResult(null);
      dispatch({ type: "NEXT_ROUND" });
      setFlyingDots([]);
      setAnimatingBanking(false);
    }, maxCount * 120 + 500);
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
            verdicts={state.optionVerdicts}
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
                <span className="text-parchment truncate flex items-center gap-2">
                  <span aria-hidden="true" className="select-none">{p.token}</span>
                  <span>{p.name}</span>
                </span>
                <span className="flex items-center gap-3 shrink-0">
                  <span
                    id={`player-pending-${i}`}
                    className={
                      "text-sm font-semibold " +
                      (failed ? "text-wrong" : "text-correct")
                    }
                  >
                    {failed
                      ? strings.statusFailed
                      : `${strings.statusPassed} +${p.pendingPoints}`}
                  </span>
                  <span
                    id={`player-score-${i}`}
                    className="font-display font-bold tabular-nums text-parchment text-xl"
                  >
                    {p.score}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
        <button
          id="next-round-btn"
          onClick={handleNextCard}
          disabled={animatingBanking}
          className="btn-brass text-lg px-10"
        >
          {strings.nextCard}
        </button>

        {flyingDots.map((dot) => (
          <span
            key={dot.id}
            className="score-dot w-3.5 h-3.5 bg-gradient-to-r from-brass-hi to-brass rounded-full shadow-[0_0_8px_rgba(240,200,105,0.85)] z-50 fixed pointer-events-none left-0 top-0"
            style={{
              "--start-x": `${dot.startX}px`,
              "--start-y": `${dot.startY}px`,
              "--end-x": `${dot.endX}px`,
              "--end-y": `${dot.endY}px`,
              animationDelay: `${dot.delay}ms`,
            } as React.CSSProperties}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-4 max-w-2xl mx-auto flex flex-col gap-3">
      {state.blitz && state.phase === "playing" && (
        <div className="w-full flex flex-col gap-1.5 px-1 mb-1">
          <div className="flex justify-between items-center text-xs eyebrow text-parchment-dim">
            <span>Tiempo restante</span>
            <span
              className={
                "font-mono font-bold transition-colors " +
                (timeLeft <= 5 ? "text-wrong animate-pulse text-sm" : "text-brass")
              }
            >
              {timeLeft}s
            </span>
          </div>
          <div className="w-full bg-[#122318] h-2 rounded-full overflow-hidden border border-parchment/10 relative">
            <div
              className={
                "h-full rounded-full transition-all duration-1000 ease-linear " +
                (timeLeft <= 5 ? "bg-wrong animate-pulse" : "bg-brass")
              }
              style={{
                width: `${(timeLeft / 15) * 100}%`,
                transitionProperty: timeLeft === 15 ? "none" : "width",
              }}
            />
          </div>
        </div>
      )}

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
        disabled={
          handoffPlayer !== null ||
          animatingBanking ||
          state.judgingOptionIndex !== null
        }
        onTap={handleTap}
        justRevealedIndex={justRevealedIndex}
        verdicts={state.optionVerdicts}
      />

      <button
        id="pass-btn"
        onClick={handlePass}
        disabled={animatingBanking || state.judgingOptionIndex !== null}
        className="btn-token text-lg mt-1"
      >
        {strings.pass}
      </button>

      {flyingDots.map((dot) => (
        <span
          key={dot.id}
          className="score-dot w-3.5 h-3.5 bg-gradient-to-r from-brass-hi to-brass rounded-full shadow-[0_0_8px_rgba(240,200,105,0.85)] z-50 fixed pointer-events-none left-0 top-0"
          style={{
            "--start-x": `${dot.startX}px`,
            "--start-y": `${dot.startY}px`,
            "--end-x": `${dot.endX}px`,
            "--end-y": `${dot.endY}px`,
            animationDelay: `${dot.delay}ms`,
          } as React.CSSProperties}
        />
      ))}

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

      {judgingAnswer !== null && (
        <JudgePanel answer={judgingAnswer} onVerdict={handleVerdict} />
      )}

      {handoffPlayer !== null && (
        <HandoffOverlay
          playerName={state.players[handoffPlayer].name}
          playerToken={state.players[handoffPlayer].token}
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

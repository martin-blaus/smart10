import { useState } from "react";
import type { Player } from "../types";
import { strings } from "../i18n/strings";

interface Props {
  players: Player[];
  currentPlayerIndex: number;
  targetScore: number;
}

const STATUS_ICON: Record<Player["roundStatus"], string> = {
  active: "",
  passed: "🖐️",
  failed: "✗",
};

export function Scoreboard({ players, currentPlayerIndex, targetScore }: Props) {
  const [open, setOpen] = useState(false);

  const currentPlayer = players[currentPlayerIndex];

  // Serpentine track layout helpers
  const cols = 6;
  const getGridCoords = (s: number) => {
    const r = Math.floor(s / cols);
    const c = s % cols;
    // Even rows wind left-to-right, odd rows wind right-to-left
    const col = r % 2 === 0 ? c + 1 : cols - c;
    const row = r + 1;
    return { row, col };
  };

  const totalSlots = targetScore + 1;

  return (
    <div id="scoreboard-panel" className="panel overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3 text-parchment-dim hover:text-parchment transition-colors"
      >
        <span className="eyebrow flex items-center gap-1.5">
          <span>📊</span>
          <span>{strings.scoreboard} · Objetivo: {targetScore} pts</span>
        </span>
        <span aria-hidden className="text-xs transition-transform duration-200">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {/* Serpentine track dashboard */}
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-4 border-t border-parchment/5 pt-3 fade-in">
          <div
            className="grid gap-2.5 mx-auto w-full max-w-sm justify-center"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(44px, 1fr))`,
            }}
          >
            {Array.from({ length: totalSlots }).map((_, s) => {
              const { row, col } = getGridCoords(s);
              const activePlayersInSlot = players
                .map((p, idx) => ({ p, idx }))
                .filter(({ p }) => p.score === s);

              const isGhostInSlot =
                currentPlayer &&
                currentPlayer.pendingPoints > 0 &&
                currentPlayer.score + currentPlayer.pendingPoints === s;

              const hasPlayers = activePlayersInSlot.length > 0 || isGhostInSlot;

              return (
                <div
                  key={s}
                  style={{ gridRow: row, gridColumn: col }}
                  className={
                    "relative rounded-full aspect-square flex flex-col items-center justify-center border transition-all select-none w-11 h-11 " +
                    (s === targetScore
                      ? "border-brass bg-brass-deep/20 shadow-[0_0_8px_rgba(224,175,82,0.35)]"
                      : s === 0
                      ? "border-parchment/30 bg-parchment/15"
                      : "border-parchment/10 bg-parchment/5")
                  }
                >
                  {/* Crown marker for targetScore */}
                  {s === targetScore && (
                    <span className="absolute -top-3 text-[10px]" aria-hidden>
                      👑
                    </span>
                  )}

                  {/* Slot Number */}
                  <span
                    className={
                      "font-mono text-center leading-none " +
                      (hasPlayers
                        ? "absolute text-[8px] bottom-1 opacity-60 text-parchment-dim"
                        : "text-sm text-parchment font-bold")
                    }
                  >
                    {s}
                  </span>

                  {/* Player Tokens in slot */}
                  {hasPlayers && (
                    <div className="flex -space-x-2.5 justify-center items-center w-full h-full pb-1.5">
                      {activePlayersInSlot.map(({ p, idx }) => (
                        <span
                          key={idx}
                          className={
                            "w-[22px] h-[22px] rounded-full bg-parchment/90 flex items-center justify-center text-xs shadow-sm border border-brass-deep/10 transition-all " +
                            (idx === currentPlayerIndex
                              ? "ring-2 ring-brass scale-110 z-10"
                              : "opacity-90")
                          }
                          title={p.name}
                        >
                          {p.token}
                        </span>
                      ))}
                      {isGhostInSlot && (
                        <span
                          className="w-[22px] h-[22px] rounded-full bg-parchment/20 border border-dashed border-brass flex items-center justify-center text-xs shadow-sm opacity-50 scale-105 animate-pulse"
                          title={`${currentPlayer.name} (Temporales)`}
                        >
                          {currentPlayer.token}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* List of players under the track */}
          <ul className="flex flex-col gap-1 border-t border-parchment/5 pt-2">
            {players.map((p, i) => (
              <li
                key={i}
                className={
                  "flex items-center justify-between text-xs py-1 " +
                  (i === currentPlayerIndex
                    ? "text-parchment font-bold"
                    : "text-parchment-dim")
                }
              >
                <span className="truncate flex items-center gap-1.5">
                  <span aria-hidden className="select-none text-sm">{p.token}</span>
                  <span>{p.name}</span>
                  <span aria-hidden>{STATUS_ICON[p.roundStatus]}</span>
                </span>
                <span className="shrink-0 tabular-nums font-semibold flex items-center gap-1">
                  <span>{p.score} pts</span>
                  {p.pendingPoints > 0 && (
                    <span className="text-brass"> (+{p.pendingPoints})</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Closed summary */}
      {!open && (
        <div className="px-4 pb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-parchment-dim border-t border-parchment/5 pt-2 fade-in">
          {players.map((p, i) => (
            <div
              key={i}
              className={
                "flex items-center gap-1 " +
                (i === currentPlayerIndex ? "text-parchment font-bold" : "")
              }
            >
              <span aria-hidden className="select-none">{p.token}</span>
              <span>{p.name}: {p.score}</span>
              {p.pendingPoints > 0 && (
                <span className="text-brass font-semibold">(+{p.pendingPoints})</span>
              )}
              {STATUS_ICON[p.roundStatus] && (
                <span aria-hidden className="ml-0.5">{STATUS_ICON[p.roundStatus]}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

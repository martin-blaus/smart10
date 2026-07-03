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

  return (
    <div className="panel">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3 text-parchment-dim"
      >
        <span className="eyebrow">
          {strings.scoreboard} · {targetScore} {strings.points}
        </span>
        <span aria-hidden>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <ul className="px-4 pb-3 flex flex-col gap-1">
          {players.map((p, i) => (
            <li
              key={i}
              className={
                "flex items-center justify-between text-sm py-1 " +
                (i === currentPlayerIndex
                  ? "text-parchment font-bold"
                  : "text-parchment-dim")
              }
            >
              <span className="truncate flex items-center gap-2">
                <span>{p.name}</span>
                <span aria-hidden>{STATUS_ICON[p.roundStatus]}</span>
              </span>
              <span className="shrink-0 tabular-nums font-semibold">
                {p.score}
                {p.pendingPoints > 0 && (
                  <span className="text-brass"> (+{p.pendingPoints})</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

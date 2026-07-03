import type { Player } from "../types";
import { strings } from "../i18n/strings";

interface Props {
  player: Player;
}

export function TurnBanner({ player }: Props) {
  return (
    <div
      aria-live="polite"
      className="flex items-center justify-between gap-3 panel px-4 py-3"
    >
      <span className="font-display text-xl font-semibold text-parchment truncate">
        {strings.turnOf(player.name)}
      </span>
      {player.pendingPoints > 0 && (
        <span
          key={player.pendingPoints}
          className="pop shrink-0 rounded-full bg-brass/20 text-brass border border-brass/40 px-3 py-1 text-sm font-bold tabular-nums"
        >
          {strings.pendingThisRound(player.pendingPoints)}
        </span>
      )}
    </div>
  );
}

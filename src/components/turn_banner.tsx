import type { Player } from "../types";
import { strings } from "../i18n/strings";

interface Props {
  player: Player;
}

export function TurnBanner({ player }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-bg-card border border-border px-4 py-3">
      <span className="font-bold text-text-primary truncate">
        {strings.turnOf(player.name)}
      </span>
      {player.pendingPoints > 0 && (
        <span className="shrink-0 rounded-full bg-gold/20 text-gold px-3 py-1 text-sm font-bold">
          {strings.pendingThisRound(player.pendingPoints)}
        </span>
      )}
    </div>
  );
}

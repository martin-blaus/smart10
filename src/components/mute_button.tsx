import { useState } from "react";
import { sounds } from "../sounds";

export function MuteButton() {
  const [muted, setMuted] = useState(sounds.isMuted());

  const handleToggle = () => {
    const nextMuted = sounds.toggleMuted();
    setMuted(nextMuted);
  };

  return (
    <button
      onClick={handleToggle}
      className="btn-quiet w-12 h-12 !p-0 rounded-full flex items-center justify-center"
      aria-label={muted ? "Activar sonido" : "Silenciar sonido"}
      aria-pressed={muted}
      title={muted ? "Activar sonido" : "Silenciar sonido"}
    >
      <span className="text-xl leading-none" aria-hidden="true">
        {muted ? "🔇" : "🔊"}
      </span>
    </button>
  );
}

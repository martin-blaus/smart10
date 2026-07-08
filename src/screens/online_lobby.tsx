import { useState } from "react";
import { strings } from "../i18n/strings";
import { DATASETS } from "../../data";
import type { DeckChoice } from "../game/deck";
import { ref, update, set } from "firebase/database";
import { rtdb } from "../firebase/config";
import { buildDeck } from "../game/deck";

interface Props {
  roomCode: string;
  userId: string;
  roomState: any;
  isHost: boolean;
  onLeave: () => void;
}

const TARGET_OPTIONS = [10, 15, 20];

const DECK_LABELS: Record<string, string> = {
  argentina: strings.datasetArgentina,
  general: strings.datasetGeneral,
  asado: strings.datasetAsado,
  decadas: strings.datasetDecadas,
  all: strings.datasetAll,
};

export function OnlineLobbyScreen({ roomCode, userId, roomState, isHost, onLeave }: Props) {
  const [copied, setCopied] = useState(false);

  const playersList = roomState.players ? Object.entries(roomState.players) : [];
  const totalPlayers = playersList.length;

  const copyCode = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "¡Sumate a Smart10!",
          text: `Sumate a mi partida de Smart10 usando el código: ${roomCode}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      // Fallback copy if share cancelled or clipboard rejected
      try {
        await navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error("Clipboard copy failed:", e);
      }
    }
  };

  const updateSettings = async (updates: any) => {
    if (!isHost) return;
    const settingsRef = ref(rtdb, `rooms/${roomCode}/settings`);
    await update(settingsRef, updates);
  };

  const kickPlayer = async (playerUid: string) => {
    if (!isHost || playerUid === userId) return;
    // Remove player from RTDB
    const updates: Record<string, any> = {};
    updates[`players/${playerUid}`] = null;
    updates["order"] = roomState.order.filter((id: string) => id !== playerUid);
    await update(ref(rtdb, `rooms/${roomCode}`), updates);
  };

  const startGame = async () => {
    if (!isHost || totalPlayers < 2) return;

    // Build the initial deck and players payload
    const deckChoice = roomState.settings.deckChoice as DeckChoice;
    const initialDeck = buildDeck(deckChoice);
    const targetScore = roomState.settings.targetScore;

    // Gather active player structures in order
    const orderedPlayers = roomState.order.map((uid: string) => {
      const p = roomState.players[uid];
      return {
        name: p.name,
        token: p.token,
      };
    });

    // Create the game state using the START_GAME schema
    // In order to avoid circular/direct state modifications, we'll write the
    // initial state directly to /game pathway in room
    const startPayload = {
      type: "START_GAME",
      players: orderedPlayers,
      targetScore,
      deck: initialDeck,
      blitz: false, // customizable later
    };

    // We can dispatch START_GAME on the sync hook, but since starting requires building
    // the game payload first, we initialize it using RTDB directly
    const gameRef = ref(rtdb, `rooms/${roomCode}/game`);
    
    // We import reducer dynamically to run it
    const { reducer } = await import("../game/logic");
    const initialGameState = reducer(undefined as any, startPayload as any);

    await set(gameRef, {
      state: initialGameState,
      version: 1,
    });

    // Update status to playing
    await update(ref(rtdb, `rooms/${roomCode}`), {
      status: "playing",
    });
  };

  const segClass = (selected: boolean) =>
    `flex-grow flex-shrink basis-[calc(33%-5px)] min-h-12 rounded-xl font-display text-sm font-bold transition-transform active:scale-95 ` +
    (selected ? "btn-brass !px-0" : "panel text-parchment-dim");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 relative max-w-sm mx-auto">
      <div className="text-center mb-6">
        <span className="eyebrow text-brass block mb-1">
          {strings.onlineLobbyTitle}
        </span>
        <h1 className="text-2xl font-bold text-parchment">
          {roomState.settings.targetScore} Puntos · {DECK_LABELS[roomState.settings.deckChoice] || roomState.settings.deckChoice}
        </h1>
      </div>

      {/* Room Code Card */}
      <div className="panel w-full p-5 flex flex-col items-center justify-center border border-brass/20 rounded-2xl mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-brass/5 rounded-full blur-2xl pointer-events-none" />
        <span className="eyebrow text-parchment-dim text-xs mb-1">
          {strings.onlineRoomCode}
        </span>
        <span className="font-mono text-5xl font-extrabold text-parchment tracking-widest block mb-4 select-all">
          {roomCode}
        </span>
        <button onClick={copyCode} className="btn-quiet px-6 text-sm">
          {copied ? strings.onlineCopiedCode : "Compartir código 🔗"}
        </button>
      </div>

      {/* Player List */}
      <div className="w-full flex-grow flex flex-col mb-6">
        <h2 className="eyebrow text-parchment-dim mb-3">
          {strings.onlinePlayersCount(totalPlayers)}
        </h2>
        <div className="flex flex-col gap-2.5 overflow-y-auto max-h-60 pr-1">
          {roomState.order && roomState.order.map((uid: string) => {
            const player = roomState.players[uid];
            if (!player) return null;
            const isMe = uid === userId;
            const isPlayerHost = uid === roomState.hostUid;

            return (
              <div key={uid} className="flex items-center justify-between panel px-4 py-3 rounded-xl border border-brass/5 relative">
                <div className="flex items-center gap-3">
                  {/* Presence indicator */}
                  <span
                    className={`w-2.5 h-2.5 rounded-full block shrink-0 ${
                      player.connected ? "bg-correct shadow-[0_0_8px_rgba(46,189,89,0.7)]" : "bg-wrong-dim"
                    }`}
                    title={player.connected ? "Conectado" : strings.onlinePlayerDisconnected}
                  />
                  <span className="text-lg" aria-hidden="true">
                    {player.token}
                  </span>
                  <span className="font-display font-medium text-parchment truncate max-w-[150px]">
                    {player.name} {isMe && <span className="text-xs text-parchment-dim">(Vos)</span>}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isPlayerHost && (
                    <span className="eyebrow text-[10px] text-brass border border-brass/35 px-1.5 py-0.5 rounded-md">
                      Host
                    </span>
                  )}
                  {isHost && !isMe && (
                    <button
                      onClick={() => kickPlayer(uid)}
                      className="btn-quiet w-7 h-7 !p-0 rounded-full flex items-center justify-center text-xs"
                      aria-label="Expulsar jugador"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Host Settings */}
      {isHost ? (
        <div className="w-full panel p-4 rounded-xl border border-brass/10 mb-6 flex flex-col gap-4">
          <div>
            <h3 className="eyebrow text-parchment-dim mb-2 text-xs">Puntaje objetivo</h3>
            <div className="flex gap-2">
              {TARGET_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => updateSettings({ targetScore: t })}
                  className={segClass(roomState.settings.targetScore === t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="eyebrow text-parchment-dim mb-2 text-xs">Temática del mazo</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(DECK_LABELS).map((key) => (
                <button
                  key={key}
                  onClick={() => updateSettings({ deckChoice: key })}
                  className={`min-h-10 rounded-xl font-display text-xs font-bold transition-transform active:scale-95 flex-grow ${
                    roomState.settings.deckChoice === key
                      ? "btn-brass"
                      : "panel text-parchment-dim"
                  }`}
                >
                  {DECK_LABELS[key]}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full panel p-4 text-center rounded-xl border border-brass/10 mb-6">
          <p className="text-sm text-parchment-dim italic animate-pulse">
            {strings.onlineWaitingHost}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="w-full flex flex-col gap-3">
        {isHost && (
          <button
            onClick={startGame}
            disabled={totalPlayers < 2}
            className="btn-brass w-full text-lg"
          >
            {strings.onlineStartGame}
          </button>
        )}
        <button onClick={onLeave} className="btn-quiet w-full text-sm">
          {strings.onlineLeaveRoom}
        </button>
      </div>
    </div>
  );
}

import React, { useReducer, useRef, useState, Suspense } from "react";
import { reducer, initialState } from "./game/logic";
import { buildDeck } from "./game/deck";
import type { DeckChoice } from "./game/deck";
import { SetupScreen } from "./screens/setup";
import { GameScreen } from "./screens/game";
import { ResultsScreen } from "./screens/results";
import { useAuth } from "./hooks/useAuth";
import { generateRoomCode, createRoom, joinRoom } from "./online/room";

// Lazy load the online game components to preserve bundle size for offline players
const OnlineGameContainer = React.lazy(() => import("./online/OnlineGameContainer"));

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  // Firebase Auth and Room states
  const { uid, loading: authLoading } = useAuth();
  const [onlineRoomCode, setOnlineRoomCode] = useState<string | null>(null);
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const [joiningState, setJoiningState] = useState(false);

  // Remember the last roster and settings so "Jugar de nuevo" can restart with same players.
  const lastGame = useRef<{
    players: { name: string; token: string }[];
    target: number;
    deckChoice: DeckChoice;
    blitz: boolean;
  } | null>(null);

  const start = (
    players: { name: string; token: string }[],
    target: number,
    deckChoice: DeckChoice,
    blitz: boolean,
  ) => {
    lastGame.current = { players, target, deckChoice, blitz };
    dispatch({
      type: "START_GAME",
      players,
      targetScore: target,
      deck: buildDeck(deckChoice),
      blitz,
    });
  };

  const startOnline = async (
    action: "create" | "join",
    playerName: string,
    playerToken: string,
    roomCode?: string
  ) => {
    if (authLoading) {
      setOnlineError("Conectando con el servidor, probá de nuevo en un momento.");
      return;
    }
    if (!uid) {
      setOnlineError("No se pudo conectar con el servidor de juego online.");
      return;
    }
    setOnlineError(null);
    setJoiningState(true);
    try {
      if (action === "create") {
        const code = generateRoomCode();
        await createRoom(code, uid, playerName, playerToken);
        setOnlineRoomCode(code);
      } else {
        if (!roomCode) throw new Error("Por favor, ingresá un código de sala.");
        await joinRoom(roomCode, uid, playerName, playerToken);
        setOnlineRoomCode(roomCode);
      }
    } catch (err: any) {
      console.error(err);
      setOnlineError(err.message || "Error al conectar con la sala.");
    } finally {
      setJoiningState(false);
    }
  };

  // Only the explicit act of joining/creating a room blocks the UI. Auth runs
  // in the background so offline solo/multiplayer stays playable even if
  // Firebase is unreachable or not yet configured.
  if (joiningState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <div className="w-10 h-10 border-4 border-brass border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-parchment-dim text-sm italic">
          Conectando a la sala...
        </p>
      </div>
    );
  }

  if (onlineRoomCode && uid) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
            <div className="w-10 h-10 border-4 border-brass border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-parchment-dim text-sm italic">Cargando sala de juego...</p>
          </div>
        }
      >
        <OnlineGameContainer
          roomCode={onlineRoomCode}
          userId={uid}
          onLeave={() => {
            setOnlineRoomCode(null);
            dispatch({ type: "RESTART" });
          }}
        />
      </Suspense>
    );
  }

  if (state.phase === "setup") {
    return (
      <div className="relative">
        {onlineError && (
          <div className="fixed top-4 left-4 right-4 bg-wrong border border-wrong/40 text-parchment px-4 py-3.5 rounded-2xl text-center text-sm z-50 shadow-lg flex items-center justify-between">
            <span className="flex-1 text-center font-medium">{onlineError}</span>
            <button onClick={() => setOnlineError(null)} className="ml-3 text-lg font-bold select-none cursor-pointer">✕</button>
          </div>
        )}
        <SetupScreen onStart={start} onStartOnline={startOnline} />
      </div>
    );
  }

  if (state.phase === "gameOver") {
    return (
      <ResultsScreen
        state={state}
        onPlayAgainSame={() => {
          const g = lastGame.current;
          if (g) start(g.players, g.target, g.deckChoice, g.blitz);
        }}
        onPlayAgainNew={() => dispatch({ type: "RESTART" })}
      />
    );
  }

  return <GameScreen state={state} dispatch={dispatch} />;
}


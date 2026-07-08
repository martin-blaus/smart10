import { useOnlineGame } from "./sync";
import { OnlineLobbyScreen } from "../screens/online_lobby";
import { GameScreen } from "../screens/game";
import { ResultsScreen } from "../screens/results";
import { leaveRoom } from "./room";
import { strings } from "../i18n/strings";

interface Props {
  roomCode: string;
  userId: string;
  onLeave: () => void;
}

export default function OnlineGameContainer({ roomCode, userId, onLeave }: Props) {
  const { roomState, gameState, loading, error, dispatch, isHost } = useOnlineGame(roomCode, userId);

  const handleLeave = async () => {
    try {
      await leaveRoom(roomCode, userId);
    } catch (err) {
      console.error("Error leaving room:", err);
    }
    onLeave();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <div className="w-10 h-10 border-4 border-brass border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-parchment-dim text-sm italic">Conectando a la sala...</p>
      </div>
    );
  }

  if (error || !roomState) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center max-w-sm mx-auto">
        <span className="text-4xl mb-4">⚠️</span>
        <h2 className="text-xl font-bold text-parchment mb-2">Error de conexión</h2>
        <p className="text-wrong text-sm mb-6">{error || "La sala no se pudo encontrar."}</p>
        <button onClick={onLeave} className="btn-brass px-8 py-2.5">
          Volver al inicio
        </button>
      </div>
    );
  }

  // 1. Lobby Phase
  if (roomState.status === "lobby") {
    return (
      <OnlineLobbyScreen
        roomCode={roomCode}
        userId={userId}
        roomState={roomState}
        isHost={isHost}
        onLeave={handleLeave}
      />
    );
  }

  // 2. GameOver Phase (handled when game status is finished or state.phase is gameOver)
  if (roomState.status === "finished" || (gameState && gameState.phase === "gameOver")) {
    return (
      <ResultsScreen
        state={gameState!}
        onPlayAgainSame={async () => {
          if (!isHost) return;
          // Restart game online by resetting the game node in RTDB
          // This matches the host startGame action but triggers RESTART on current deck
          const { reducer } = await import("../game/logic");
          const { buildDeck } = await import("../game/deck");
          const nextDeck = buildDeck(roomState.settings.deckChoice);
          const orderedPlayers = roomState.order.map((uid: string) => {
            const p = roomState.players[uid];
            return { name: p.name, token: p.token };
          });
          
          const startPayload = {
            type: "START_GAME",
            players: orderedPlayers,
            targetScore: roomState.settings.targetScore,
            deck: nextDeck,
            blitz: false,
          };
          
          const initialGameState = reducer(undefined as any, startPayload as any);
          
          const { ref, set, update } = await import("firebase/database");
          const { rtdb } = await import("../firebase/config");
          
          await set(ref(rtdb, `rooms/${roomCode}/game`), {
            state: initialGameState,
            version: 1,
          });
          await update(ref(rtdb, `rooms/${roomCode}`), {
            status: "playing",
          });
        }}
        onPlayAgainNew={handleLeave}
        isOnlineHost={isHost}
      />
    );
  }

  // 3. Gameplay Phase
  if (gameState) {
    const currentPlayerUid = roomState.order?.[gameState.currentPlayerIndex];
    const isMyTurn = currentPlayerUid === userId;
    return (
      <GameScreen
        state={gameState}
        dispatch={dispatch}
        userId={userId}
        online
        isMyTurn={isMyTurn}
        isHost={isHost}
      />
    );
  }

  return null;
}

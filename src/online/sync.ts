import { useEffect, useState, useCallback } from "react";
import { ref, onValue, runTransaction, set } from "firebase/database";
import { rtdb } from "../firebase/config";
import { GameState, Action } from "../types";
import { reducer, normalizeGameState } from "../game/logic";

export function useOnlineGame(roomCode: string, userId: string) {
  const [roomState, setRoomState] = useState<any>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomCode) return;

    const roomRef = ref(rtdb, `rooms/${roomCode}`);
    const unsubscribe = onValue(
      roomRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          setRoomState(val);
          if (val.game && val.game.state) {
            setGameState(normalizeGameState(val.game.state));
          } else {
            setGameState(null);
          }
          setLoading(false);
        } else {
          setError("La sala no existe o fue eliminada.");
          setLoading(false);
        }
      },
      (err) => {
        console.error("RTDB Sync Error:", err);
        setError("Error al sincronizar con el servidor.");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [roomCode]);

  const dispatch = useCallback(
    async (action: Action) => {
      if (!roomCode || !roomState) return;

      const hostUid = roomState.hostUid;
      const isHost = userId === hostUid;

      // Guard check: is this player allowed to execute this action?
      const isActionAllowed = () => {
        if (action.type === "START_GAME" || action.type === "NEXT_ROUND" || action.type === "RESTART") {
          return isHost;
        }

        if (!gameState) return false;

        // If it's a game-play action (TAP_OPTION, PASS, TIME_OUT), it must be the current player's turn
        const currentPlayerIndex = gameState.currentPlayerIndex;
        const currentPlayerUid = roomState.order[currentPlayerIndex];

        // Exception: PASS or TIME_OUT could be dispatched by the host if a player disconnected >15s (skip turn)
        if (action.type === "PASS" || action.type === "TIME_OUT") {
          if (userId === currentPlayerUid) return true;
          // If player disconnected and I am host, we allow host to trigger pass
          if (isHost) {
            const playerDetails = roomState.players[currentPlayerUid];
            if (playerDetails && !playerDetails.connected) {
              return true; // Host skipped disconnected player
            }
          }
          return false;
        }

        // JUDGE_ANSWER is triggered by table consensus, but in online mode,
        // it can be submitted by the current active player who is being judged, or host.
        // Let's allow the host or the current player to judge.
        if (action.type === "JUDGE_ANSWER") {
          return isHost || userId === currentPlayerUid;
        }

        return userId === currentPlayerUid;
      };

      if (!isActionAllowed()) {
        console.warn("Acción no permitida para el rol actual.", action);
        return;
      }

      // Perform transaction to execute the pure reducer locally and push to server
      const gameRef = ref(rtdb, `rooms/${roomCode}/game`);
      await runTransaction(gameRef, (currentVal) => {
        // If state doesn't exist yet, we only allow START_GAME to initialize it
        if (!currentVal) {
          if (action.type === "START_GAME") {
            const initialGameState = reducer(undefined as any, action);
            return {
              state: initialGameState,
              version: 1,
            };
          }
          return;
        }

        const nextState = reducer(normalizeGameState(currentVal.state), action);
        return {
          state: nextState,
          version: (currentVal.version || 0) + 1,
        };
      });
    },
    [roomCode, roomState, gameState, userId]
  );

  return {
    roomState,
    gameState,
    loading,
    error,
    dispatch,
    isHost: roomState ? userId === roomState.hostUid : false,
  };
}

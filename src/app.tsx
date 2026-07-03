import { useReducer, useRef } from "react";
import { reducer, initialState } from "./game/logic";
import { buildDeck } from "./game/deck";
import type { DatasetKey } from "./game/deck";
import { SetupScreen } from "./screens/setup";
import { GameScreen } from "./screens/game";
import { ResultsScreen } from "./screens/results";

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  // Remember the last roster and settings so "Jugar de nuevo" can restart with same players.
  const lastGame = useRef<{ names: string[]; target: number; datasetKey: DatasetKey } | null>(null);

  const start = (names: string[], target: number, datasetKey: DatasetKey) => {
    lastGame.current = { names, target, datasetKey };
    dispatch({
      type: "START_GAME",
      playerNames: names,
      targetScore: target,
      deck: buildDeck(datasetKey),
    });
  };

  if (state.phase === "setup") {
    return <SetupScreen onStart={start} />;
  }

  if (state.phase === "gameOver") {
    return (
      <ResultsScreen
        state={state}
        onPlayAgainSame={() => {
          const g = lastGame.current;
          if (g) start(g.names, g.target, g.datasetKey);
        }}
        onPlayAgainNew={() => dispatch({ type: "RESTART" })}
      />
    );
  }

  return <GameScreen state={state} dispatch={dispatch} />;
}


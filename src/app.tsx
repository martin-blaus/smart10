import { useReducer, useRef } from "react";
import { reducer, initialState } from "./game/logic";
import { buildDeck } from "./game/deck";
import { SetupScreen } from "./screens/setup";
import { GameScreen } from "./screens/game";
import { ResultsScreen } from "./screens/results";

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  // Remember the last roster so "Jugar de nuevo" can restart with same players.
  const lastGame = useRef<{ names: string[]; target: number } | null>(null);

  const start = (names: string[], target: number) => {
    lastGame.current = { names, target };
    dispatch({
      type: "START_GAME",
      playerNames: names,
      targetScore: target,
      deck: buildDeck(),
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
          if (g) start(g.names, g.target);
        }}
        onPlayAgainNew={() => dispatch({ type: "RESTART" })}
      />
    );
  }

  return <GameScreen state={state} dispatch={dispatch} />;
}

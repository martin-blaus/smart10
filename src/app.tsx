import { useReducer, useRef } from "react";
import { reducer, initialState } from "./game/logic";
import { buildDeck } from "./game/deck";
import type { DeckChoice } from "./game/deck";
import { SetupScreen } from "./screens/setup";
import { GameScreen } from "./screens/game";
import { ResultsScreen } from "./screens/results";

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
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

  if (state.phase === "setup") {
    return <SetupScreen onStart={start} />;
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


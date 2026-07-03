// All user-facing text lives here (Spanish). Code stays in English.
export const strings = {
  appTitle: "Smart10",
  tagline: "10 respuestas por carta. ¿Cuántas te animás a acertar?",

  // Setup
  setupPlayers: "Jugadores",
  setupPlayerPlaceholder: (n: number) => `Jugador ${n}`,
  setupAddPlayer: "Agregar jugador",
  setupRemovePlayer: "Quitar",
  setupTargetScore: "Puntaje para ganar",
  setupStart: "Empezar",
  setupMinPlayers: "Se necesitan al menos 2 jugadores.",

  // Game
  turnOf: (name: string) => `Turno de ${name}`,
  pendingThisRound: (n: number) => `+${n} esta ronda`,
  pass: "¡Me planto!",
  passNoPointsConfirm: "¿Pasar sin sumar puntos esta ronda?",
  scoreboard: "Tabla",
  points: "pts",
  correctSo: "¡Correcto!",
  wrongSo: "¡Fallaste!",

  // Round status labels
  statusActive: "Jugando",
  statusPassed: "Se plantó",
  statusFailed: "Falló",

  // Handoff
  handoffTitle: (name: string) => `Pasale el dispositivo a ${name}`,
  handoffSubtitle: "Cuando lo tenga, tocá continuar.",
  handoffReady: "¡Listo!",

  // Round end
  roundEndTitle: "Fin de la ronda",
  nextCard: "Siguiente carta",

  // Results
  winnerTitle: (name: string) => `¡Ganó ${name}!`,
  finalStandings: "Posiciones finales",
  playAgainSame: "Jugar de nuevo",
  playAgainNew: "Nuevos jugadores",
};

// All user-facing text lives here (Spanish). Code stays in English.
export const strings = {
  appTitle: "Smart10",
  tagline: "10 respuestas por carta. ¿Cuántas te animás a acertar?",

  // Setup
  setupMode: "Modo",
  modeSolo: "Solitario",
  modeMulti: "Multijugador",
  setupSoloName: "Tu nombre",
  setupPlayers: "Jugadores",
  setupPlayerPlaceholder: (n: number) => `Jugador ${n}`,
  setupAddPlayer: "Agregar jugador",
  setupRemovePlayer: "Quitar",
  setupTargetScore: "Puntaje para ganar",
  setupDataset: "Temática",
  datasetGeneral: "General",
  datasetMovies: "Cine",
  datasetArgentina: "Argentina",
  datasetAll: "Todas",
  setupBlitz: "Modo Blitz",
  blitzActive: "Activo (15s)",
  blitzInactive: "Inactivo",
  setupStart: "Empezar",
  setupMinPlayers: "Se necesitan al menos 2 jugadores.",

  // Game
  turnOf: (name: string) => `Turno de ${name}`,
  pendingThisRound: (n: number) => `+${n} esta ronda`,
  pass: "¡Me planto!",
  passNoPointsConfirm: "¿Plantarte sin sumar puntos esta ronda?",
  passConfirmYes: "Sí, me planto",
  passConfirmNo: "Seguir jugando",
  scoreboard: "Tabla",
  points: "pts",
  correctSo: "¡Correcto!",
  wrongSo: "¡Fallaste!",

  // Self-judged (answer) cards
  judgePrompt: "¿La acertó?",
  judgeAnswerWas: "La respuesta era:",
  judgeCorrect: "Sí, ¡acertó!",
  judgeWrong: "No, falló",

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
  roundEndAnswers: "Las respuestas",
  nextCard: "Siguiente carta",

  // Results
  winnerTitle: (name: string) => `¡Ganó ${name}!`,
  soloResultEyebrow: "Modo solitario",
  soloResultTitle: "¡Lo lograste!",
  finalStandings: "Posiciones finales",
  playAgainSame: "Jugar de nuevo",
  playAgainNew: "Nuevos jugadores",
};

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
  datasetArgentina: "Argentina",
  datasetGeneral: "Trivia",
  datasetAsado: "Asado",
  datasetDecadas: "Décadas",
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
  judgeSwipeRight: "Acertó",
  judgeSwipeLeft: "Falló",

  // Round status labels
  statusActive: "Jugando",
  statusPassed: "Se plantó",
  statusFailed: "Falló",

  // Turn transition
  turnNext: "Ahora juega:",

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

  // Results — stats & awards
  statsLine: (correct: number, misses: number, streak: number) =>
    `${correct}✓ ${misses}✗ · racha ${streak}`,
  awardStreak: "Racha de fuego",
  awardDaring: "Se la jugó",
  awardPlanted: "Rey de plantarse",
  soloStatsCorrect: "Aciertos",
  soloStatsWrong: "Errores",
  soloStatsBestStreak: "Mejor racha",
  soloStatsBestRound: "Mejor ronda",

  // Online Multiplayer
  modeOnline: "En línea",
  onlineCreateRoom: "Crear sala",
  onlineJoinRoom: "Unirme con código",
  onlineRoomCode: "Código de sala",
  onlineLobbyTitle: "Sala de espera",
  onlinePlayersCount: (n: number) => `Jugadores (${n}/8)`,
  onlineWaitingHost: "Esperando que el anfitrión empiece...",
  onlineStartGame: "Empezar partida",
  onlineHostDisconnected: "El anfitrión se desconectó",
  onlinePlayerDisconnected: "Desconectado",
  onlineSkipTurn: "Saltear turno",
  onlineLeaveRoom: "Salir de la sala",
  onlineInvalidCode: "Código de sala inexistente o cerrado.",
  onlineRoomFull: "La sala está llena (máximo 8 jugadores).",
  onlineCopiedCode: "¡Código copiado!",
  onlineSeedDb: "Inicializar cartas (Dev)",
  onlineSeeding: "Inicializando...",
  onlineSeedSuccess: "¡Cartas cargadas con éxito!",
  onlineSeedError: "Error al cargar cartas",
  onlineYourTurn: "¡Tu turno!",
  onlineWaitingTurnOf: (name: string) => `Esperando el turno de ${name}`,
  onlineWaitingHostNext: "Esperando que el anfitrión pase a la siguiente carta...",
  onlineLikes: "Me gusta",
  onlineDislikes: "No me gusta",
};

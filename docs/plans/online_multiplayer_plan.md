# Smart10 — Online Multiplayer Plan (separate track)

A self-contained plan for an AI to add **online rooms**: each player joins from
their own device via a short room code. This is a separate track from
`game_feel_plan.md`; if both run, land this one after it (it touches the same
screens) and rebase accordingly.

## Ground rules

Same working agreement as always: **one commit per phase, STOP for Martin's
review after each**; `npm run lint && npm test && npm run build` green per
commit; Spanish UI strings only in `src/i18n/strings.ts`; English code; keep
the felt/brass theme and existing a11y semantics. Pass-and-play and solo modes
must keep working unchanged, fully offline — online is additive.

## Why this is feasible

The game engine is already a **pure, serializable reducer**
(`src/game/logic.ts`): `GameState` is a plain JSON object (players, deck as
card-id strings, revealedOptions, phase, targetScore...) and every transition
is `reducer(state, action)`. Online play = replicating that state object;
no engine rewrite.

## Stack decision

- **Firebase Realtime Database** (not Firestore): lower latency, native
  presence via `onDisconnect`, tiny payloads, generous free tier (Spark is
  enough — a room's state is <10 KB). The project already deploys to Firebase
  Hosting (`smart10-cb385`, see `.firebaserc`); RTDB is enabled from the
  console (document this step for Martin — it needs his account).
- **Anonymous Auth** for stable `uid`s without signup friction.
- New dep: `firebase` (modular v10+ SDK). Import only `app/auth/database`
  entry points; verify bundle impact in the build output (expect +40–60 kB gz).

## Data model

```
rooms/{code}: {
  createdAt: number,            // serverTimestamp
  hostUid: string,
  status: "lobby" | "playing" | "finished",
  settings: { targetScore: number, deckChoice: string },
  players: { [uid]: { name, token, joinedAt, connected: boolean } },
  order: [uid, ...],            // turn order, fixed by host at start
  game: { state: <GameState JSON>, version: number } | null
}
```

- **Room code**: 4 chars from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no
  ambiguous 0/O/1/I). Create with a transaction that fails if the code exists;
  retry with a new code.
- **Write model (v1, trust-your-friends)**: whichever client legitimately acts
  (the current player for TAP/PASS, the host for START/NEXT_ROUND) runs the
  pure reducer locally and writes `{state, version: version+1}` via
  `runTransaction`, aborting if `version` moved underneath (prevents clobber,
  not cheating — acceptable for a friends game; note this explicitly in code).
- `GameState.players[i]` maps to `order[i]` — store name/token inside the
  GameState as today, so the game screen needs almost no changes.

## Security rules (`database.rules.json`)

Deployed via `firebase deploy --only database` (add `"database"` block to
`firebase.json`). v1 rules: authenticated reads/writes scoped to the room;
only `hostUid` may write `status`/`settings`/`order`; a player may only write
their own `players/{uid}`; `game` writable by any room member (see trust note);
validate room code shape and field types. Include a `.indexOn` nothing —
lookups are direct by key.

## Client architecture

- `src/online/room.ts` — create/join/leave, presence (`onDisconnect` sets
  `connected: false`), subscription helpers returning unsubscribe fns.
- `src/online/sync.ts` — the bridge: `useOnlineGame(code, uid)` hook exposing
  `{ state, dispatch }` with the **same shape as `useReducer`** so
  `GameScreen` stays agnostic. `dispatch` = guard (is it my turn / am I host)
  → `reducer(current, action)` → transactional write. Remote updates flow in
  via subscription.
- `src/app.tsx` — third top-level branch: `local` (existing) vs `online`
  (room flow). Firebase is **lazy-loaded** (`import()`) only when the user
  enters online mode, so offline/local play never pays the bundle cost.
- Config: `src/online/firebase_config.ts` with the web app config object
  (public by design; Martin creates the web app in the console and pastes it).

## UX flow (all Spanish)

1. **Setup** gains mode "En línea" alongside Solitario/Multijugador. Choosing
   it → name+token entry, then two buttons: "Crear sala" / "Unirme con código"
   (4-char field, auto-uppercase, `autocomplete="off"`).
2. **Lobby screen** (`src/screens/lobby.tsx`): big room code (tap to copy +
   Web Share API), live player list with tokens and connection dots, host
   controls (target score, deck, kick, "Empezar" enabled at 2+ players).
   Guests see "Esperando a que {host} empiece…".
3. **Online game**: reuse `GameScreen` with these deltas — no hand-off overlay
   (each player has their own device); pegs and ¡Me planto! disabled unless
   it's your turn; turn banner shows "Turno de 🦊 Ana" vs "¡Tu turno!"
   (aria-live already present); everyone watches reveals live. Round-end and
   results screens work as-is; only the host sees/presses "Siguiente carta"
   (guests see a waiting note).
4. **Disconnects**: connection dot greys out. If the *current* player is
   disconnected >15s, the host gets a "Saltear turno" button that dispatches
   `PASS` on their behalf. Host disconnect v1: room shows "El anfitrión se
   desconectó" with a leave button (host migration is out of scope; note it).

## Phases / commits

1. **`feat(online): firebase setup + rooms and lobby`** — dep, lazy config,
   anonymous auth, create/join/leave with presence, lobby screen, rules file +
   firebase.json. Verify: two CDP browser contexts create/join the same room
   and see each other live.
2. **`feat(online): synchronized gameplay`** — sync hook, online GameScreen
   wiring, turn guards, host-driven NEXT_ROUND, full game two-context E2E to a
   winner. Unit-test the guard logic and version-conflict retry with a mocked
   write layer (reducer itself already covered).
3. **`feat(online): resilience and polish`** — disconnect handling, skip-turn,
   copy/share code, "salir de la sala", finished-room cleanup (rooms older
   than 24h purgeable — document a console TTL or ignore for v1), error states
   (sala llena >8, código inexistente, versión de app).
4. **`docs(online): rules hardening + deploy`** — tighten rules, README
   section (enable RTDB, paste config, `firebase deploy --only
   hosting,database`), cost note.

## Testing strategy

- Reducer untouched → existing 262 tests keep passing.
- New unit tests: room-code generator, turn-guard logic, version-retry.
- E2E: extend the CDP driver pattern (see scratchpad drivers referenced in git
  history) to open **two** pages against the RTDB **emulator**
  (`firebase emulators:start --only database,auth`) — never test against prod.
  Emulator config goes in `firebase.json`; wire the client to it when
  `location.hostname === "localhost"` unless a flag says otherwise.

## Explicit non-goals (v1)

Cheating prevention beyond version conflicts; host migration; spectators;
matchmaking; chat; accounts/profiles; native push. List them in the README so
scope stays honest.

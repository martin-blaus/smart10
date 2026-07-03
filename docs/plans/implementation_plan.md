# Smart10 — Implementation Plan

A web/mobile online adaptation of the board game **Smart10** (SD Games). Pass-and-play multiplayer on a single shared device, deployed as a static site on Firebase Hosting.

**Conventions (non-negotiable):**
- All code, identifiers, comments, and file names in **English**.
- All user-facing text in **Spanish** (Argentina-neutral Spanish is fine), centralized in `src/i18n/strings.ts`.
- Mirror the stack and conventions of the sibling project `/Users/martinblaustein/Projects/martin/history-game` (React 19, Vite, TypeScript, Tailwind CSS 4, Vitest, ESLint, Prettier).
- No backend, no auth, no database. Pure static SPA.

---

## 1. Game rules (digital adaptation)

### Card
Each card has 1 question (Spanish) and **exactly 10 answer options**. Some options are correct, others are traps (incorrect). Each option may carry an `info` string shown when revealed (e.g., the actual population figure).

### Round (one card = one round)
- Players act in turn order. The starting player rotates by one each round.
- On your turn you must either:
  - **Tap an unrevealed option**:
    - If `correct: true` → the option flips green with ✓ (+ info). You earn **1 pending point** for this round. Turn passes to the next *active* player.
    - If `correct: false` → the option flips red with ✗ (+ info). You **lose all pending points** from this round and are **out of the round** (status `failed`). Banked score is untouched.
  - **Pass ("¡Me planto!")**: your pending points are **banked** into your permanent score and you are out of the round (status `passed`).
- Players who are out of the round are skipped. If only one active player remains, they take consecutive turns until they pass, fail, or the card is exhausted.
- **Round ends** when:
  - all players are out (passed/failed), or
  - all `correct: true` options have been revealed (card exhausted) — in that case every still-active player banks their pending points automatically.

### Game end
- 2–8 players; target score configurable at setup: 10 / 15 / **20** (default **15**).
- At the **end of each round** (never mid-round): if any player's banked score ≥ target, the player with the highest score wins. If two or more leaders tie at/above the target, play one more card as a tiebreaker (repeat if still tied).
- Otherwise deal the next card. If the deck runs out, reshuffle used cards (log a console warning — the test dataset is small).

---

## 2. Project structure

```
smart10/
  data/
    dataset.json           # question cards (Spanish content)
    types.ts               # Card/Option TS types + typed JSON import/export
    dataset.test.ts        # dataset integrity tests
  src/
    main.tsx               # entry, mounts <App/>
    app.tsx                # top-level phase router (setup | playing | gameOver)
    types.ts               # GameState, Player, actions
    game/
      logic.ts             # pure reducer — ALL rules live here
      logic.test.ts        # exhaustive unit tests for the rules
      deck.ts              # shuffle (seedable for tests), deal, reshuffle
    screens/
      setup.tsx            # player names, target score, start button
      game.tsx             # main card screen
      results.tsx          # winner + final scoreboard + play again
    components/
      option_peg.tsx       # one of the 10 options, with flip reveal
      scoreboard.tsx       # collapsible score panel
      turn_banner.tsx      # whose turn + pending points chip
      handoff_overlay.tsx  # "Pasale el dispositivo a X" blocking cue
    i18n/
      strings.ts           # ALL Spanish UI strings
    index.css              # Tailwind entry
  index.html               # lang="es", viewport meta, title "Smart10"
  firebase.json            # hosting config (see §6)
  .firebaserc              # placeholder project id (see §6)
  vite.config.ts, vitest.config.ts, tsconfig.json, eslint.config.js
  package.json             # scripts: dev, build (tsc -b && vite build), test, lint, format, preview
  README.md
```

Copy config file conventions (tsconfig, eslint flat config, `@tailwindcss/vite` plugin, prettier) from `history-game`. Dependencies: `react`, `react-dom`, `canvas-confetti`; dev deps same list as history-game.

---

## 3. Dataset schema — `data/dataset.json`

```json
{
  "cards": [
    {
      "id": "card-001",
      "category": "Geografía",
      "question": "¿Cuáles de estos países tienen más de 50 millones de habitantes?",
      "options": [
        { "text": "México",  "correct": true,  "info": "≈128 millones" },
        { "text": "Uruguay", "correct": false, "info": "≈3,5 millones" }
      ]
    }
  ]
}
```

Types in `data/types.ts`:

```ts
export interface CardOption { text: string; correct: boolean; info?: string }
export interface Card { id: string; category: string; question: string; options: CardOption[] } // exactly 10 options
```

**Content**: seed 8–10 test cards in Spanish across categories (Geografía, Historia, Deportes, Cine, Ciencia, Música…). Mix of ratios (e.g., 4 correct / 6 traps, 7/3, etc.). Accuracy matters — verify facts before writing them.

**Integrity tests** (`data/dataset.test.ts`, pattern from history-game's `deck_integrity.test.ts`):
- every card has exactly 10 options
- at least 1 correct and at least 1 incorrect option per card
- unique card ids, non-empty question/text fields

---

## 4. Game logic — pure reducer (`src/game/logic.ts`)

```ts
type RoundStatus = 'active' | 'passed' | 'failed'
interface Player { name: string; score: number; pendingPoints: number; roundStatus: RoundStatus }
interface GameState {
  phase: 'setup' | 'playing' | 'roundEnd' | 'gameOver'
  players: Player[]
  currentPlayerIndex: number
  roundStartPlayerIndex: number
  deck: string[]            // shuffled card ids remaining
  usedCardIds: string[]
  currentCardId: string | null
  revealedOptions: number[] // indexes into card.options
  targetScore: number
  winnerIndexes: number[]   // filled on gameOver
}
type Action =
  | { type: 'START_GAME'; playerNames: string[]; targetScore: number; deck: string[] }
  | { type: 'TAP_OPTION'; optionIndex: number }
  | { type: 'PASS' }
  | { type: 'NEXT_ROUND' }   // from roundEnd → deal next card or gameOver
  | { type: 'RESTART' }
```

- The reducer is **pure** (no `Math.random` / `Date` inside; shuffling happens in `deck.ts` and the shuffled order is passed in via actions). This makes every rule unit-testable.
- `roundEnd` is an explicit phase so the UI can show a round summary before dealing the next card.
- Illegal actions (tapping a revealed option, acting out of phase) are no-ops returning the same state.

**Required unit tests** (`logic.test.ts`):
1. Correct tap adds a pending point and advances to the next *active* player (skipping out players).
2. Wrong tap clears pending points only (banked score untouched) and marks the player `failed`.
3. Pass banks pending points and marks `passed`.
4. Round ends when everyone is out; round ends when the last correct option is revealed, banking pending points of still-active players.
5. Sole survivor takes consecutive turns.
6. Win detected only at round end; highest score wins; tie at/above target → another round; below target → next card dealt.
7. Starting player rotates each round.
8. Deck exhaustion triggers reshuffle of used cards.

---

## 5. UX spec (mobile-first, all text Spanish)

- **Setup screen**: add/remove 2–8 player name inputs, target score selector (10/15/20, default 15), "Empezar" button.
- **Game screen** layout, top to bottom:
  1. Turn banner: "Turno de **{name}**" + pending points chip ("+2 esta ronda").
  2. Category badge + question text.
  3. 10 option pegs in a responsive grid: 2×5 on portrait/narrow, 5×2 on landscape/desktop. Unrevealed = neutral tappable card; revealed = green ✓ / red ✗ with `info` text, non-tappable. CSS flip animation on reveal.
  4. Big "¡Me planto!" button (disabled with hint when pending points = 0 — you may still pass, but confirm: "¿Pasar sin puntos?").
  5. Collapsible scoreboard (banked scores, round status icons per player).
- **Hand-off overlay**: when the turn moves to another player, show a full-screen blocking cue "Pasale el dispositivo a {name}" with a "¡Listo!" button, so the next player doesn't see the previous reveal reaction. Skip it when the same player repeats (sole survivor).
- **Round end**: summary panel (who banked what) + "Siguiente carta" button.
- **Results screen**: winner announcement + `canvas-confetti`, final ranking table, "Jugar de nuevo" (same players) and "Nuevos jugadores".
- Touch targets ≥ 44px; readable from ~360px width to desktop; `lang="es"` on `<html>`; no component library — Tailwind utilities only.

---

## 6. Firebase deployment

`firebase.json` (same shape as history-game):

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```

`.firebaserc` with a placeholder — Martin will create/choose the Firebase project id:

```json
{ "projects": { "default": "REPLACE_WITH_FIREBASE_PROJECT_ID" } }
```

Deploy: `npm run build` then `firebase deploy --only hosting`. Document both in README.

---

## 7. Build order — ONE COMMIT PER TASK, STOP AFTER EACH

**Process rule for the executing AI:** initialize a git repo first. Complete exactly one task below, verify it, make exactly one commit, then **STOP and wait for Martin's review** before starting the next task. Do not batch tasks.

| # | Commit | Scope | Verify before committing |
|---|--------|-------|--------------------------|
| 1 | `chore: scaffold project` | Vite + React + TS + Tailwind 4, ESLint/Prettier configs, firebase.json/.firebaserc, empty app shell ("Smart10" title renders) | `npm run dev` shows shell; `npm run build` passes |
| 2 | `feat: question dataset` | `data/types.ts`, `dataset.json` (8–10 Spanish cards), `dataset.test.ts` | `npm test` green |
| 3 | `feat: game logic` | `src/types.ts`, `src/game/logic.ts`, `src/game/deck.ts`, full `logic.test.ts` suite (§4) | `npm test` green |
| 4 | `feat: setup and game screens` | setup screen, game screen wired to reducer: tap/reveal, pass, hand-off overlay, turn banner | play a full 2-player game in `npm run dev`; check 360px viewport |
| 5 | `feat: round end, results and polish` | round-end summary, results screen + confetti, scoreboard, flip animations, responsive pass | full game to victory works on mobile viewport and desktop |
| 6 | `docs: deploy readiness` | README (run/build/deploy instructions), final `npm run lint && npm test && npm run build` | all green; deploy steps documented |

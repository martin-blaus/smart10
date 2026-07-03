# Smart10 — Game Feel Plan (quick wins + board-game feel)

A self-contained plan for an AI to implement 8 features that make the digital
Smart10 feel more like a physical board game. Scope agreed with Martin:
**all quick wins** (sound+haptics, mixed deck, suspense flip, wake lock, card
counter) and **all board-game-feel features except team mode** (score race
track, player tokens, points-that-travel, turn timer).

## Ground rules (non-negotiable)

- **One commit per feature, then STOP and wait for Martin's review** before the
  next one. Never batch.
- Per-commit gates: `npm run lint && npm test && npm run build` all green.
  Presentation changes must also be verified visually: run `npm run dev`, drive
  the real app with headless Chrome via CDP (`--remote-debugging-port=9222`,
  `Emulation.setDeviceMetricsOverride` 390×844 mobile and ~1360×860 desktop),
  screenshot, and LOOK at the screenshot.
- Code/identifiers in **English**; every user-facing string in **Spanish**, in
  `src/i18n/strings.ts` only.
- Respect the existing theme (`src/index.css` `@theme`: felt/cream/brass/
  parchment tokens; `.btn-brass`, `.btn-token`, `.btn-quiet`, `.panel`,
  `.field`, `.eyebrow`, `.dial` component classes). No new colors outside it.
- `prefers-reduced-motion` must collapse every new animation/delay; touch
  targets ≥44px; keep `aria-*` semantics equivalent to what exists.
- The reducer (`src/game/logic.ts`) is pure and fully tested (262 tests).
  Features 1–4 and 6–8 must NOT change reducer semantics. Feature 5 (player
  tokens) is the only sanctioned reducer-adjacent change.

## Architecture you inherit

- `src/game/logic.ts` — pure reducer; actions `START_GAME | TAP_OPTION | PASS |
  NEXT_ROUND | RESTART`; state includes `players[] {name, score, pendingPoints,
  roundStatus}`, `currentPlayerIndex`, `deck` (card-id list), `usedCardIds`,
  `revealedOptions`, `phase: setup|playing|roundEnd|gameOver`, `targetScore`.
- `src/game/deck.ts` — `buildDeck(datasetKey, rng)`, `getCard(id)`; datasets
  come from the `DATASETS` registry in `data/index.ts` (`classic | movies |
  argentina`), `DatasetKey` derives from it.
- Screens: `src/screens/setup.tsx` (Modo solitario/multijugador toggle,
  `segClass` helper for segmented buttons, `DATASET_LABELS` map), `game.tsx`
  (hand-off overlay state `handoffPlayer`, pass-confirm dialog, round-end full
  reveal), `results.tsx` (solo + multi variants, canvas-confetti).
- Components: `round_card.tsx` (the dial; `ARC_MAGNITUDE` ellipse table),
  `option_peg.tsx` (`peg-flip` CSS animation on reveal), `scoreboard.tsx`
  (collapsible; fixed top-right at `xl:`), `turn_banner.tsx`,
  `handoff_overlay.tsx`, `confirm_dialog.tsx`.
- Reference implementation for sound: **read
  `/Users/martinblaustein/Projects/martin/history-game/src/sounds.ts`** —
  WebAudio-synthesized tones + `navigator.vibrate`, no asset files, one
  persisted mute flag gating both, `ensureCtx()` resumed on first pointerdown
  in `main.tsx`. Mirror this pattern (adapt storage to a tiny localStorage
  helper; smart10 has none yet).

---

## Commit 1 — Sound + haptics + mute (`feat: sound effects and haptics`)

New `src/sounds.ts` (mirroring history-game's): synthesized effects, all gated
by one muted flag persisted in localStorage (`smart10:muted`). Haptics
(`navigator.vibrate`) fire with their sound and obey the same mute.

| Event | Hook point | Feel |
|---|---|---|
| peg tap/flip | `handleTap` in game.tsx | short woody click |
| correct | after tap when `option.correct` | warm two-note ding, vibrate [30] |
| wrong | after tap when not correct | low thud, vibrate [60,40,60] |
| bank ("¡Me planto!") | `doPass` | token *clack*, vibrate [20,20] |
| round end | entering `roundEnd` | soft card-shuffle swish |
| win | results mount (with confetti) | brief fanfare, vibrate [40,60,40,60,120] |

Add `src/components/mute_button.tsx` (small 🔊/🔇 `btn-quiet` circle,
`aria-pressed`, Spanish `aria-label`), shown on the game screen corner and
setup footer. Unlock audio on first `pointerdown` in `main.tsx` (autoplay
policy). Time correct/wrong sounds to land at the END of the suspense flip
once Commit 2 exists (fine to land at reveal-instant in this commit).

## Commit 2 — Suspense flip (`feat(ui): suspense peg flip`)

Presentation only; dispatch stays synchronous. When a peg is tapped, it should
flip but hold a neutral cream face ~350–450ms before the green/red result
shows: extend the revealed peg in `option_peg.tsx` with an absolutely
positioned cream cover (`::before` or an element) that fades/flips away after
the delay, only for the peg whose reveal just happened (pass a `justRevealed`
flag from `game.tsx`, tracked in UI state; pegs revealed in earlier turns render
final state instantly — critical for the round-end `revealAll` dial).

The hand-off overlay currently appears the instant the turn changes and would
cover the reveal: in `game.tsx`, when a tap just occurred, delay
`setHandoffPlayer(...)` by ~900ms (`setTimeout`, cleared on unmount/re-run) so
the acting player sees the flip land before the overlay. Under
`prefers-reduced-motion`, both the hold and the overlay delay collapse to 0.
Move the correct/wrong sound+vibration (Commit 1) to fire at reveal moment.

## Commit 3 — Mixed deck (`feat: play with all decks mixed`)

UI-level pseudo-key, not a registry entry (avoid duplicating cards in
`ALL_CARDS`): `type DeckChoice = DatasetKey | "all"`. `buildDeck` accepts
`DeckChoice`; `"all"` shuffles `Object.values(DATASETS).flat()` ids. Setup's
Temática row appends a "Todas" button (string `datasetAll: "Todas"`); the four
buttons may need `text-sm` + `flex-wrap` — screenshot at 360px to confirm fit.
Add a `buildDeck("all")` unit test (contains ids from every dataset, length =
sum). Thread `DeckChoice` through `app.tsx`'s `lastGame` replay.

## Commit 4 — Table comforts: wake lock + card counter (`feat(ui): wake lock and card counter`)

Two tiny features, one commit. **Wake lock**: `navigator.wakeLock.request
("screen")` while `phase` is `playing`/`roundEnd`; re-acquire on
`visibilitychange`; release on game over/unmount; feature-detect silently
(Safari < 16.4). Implement as `useWakeLock()` hook in `src/hooks/`. **Card
counter**: small `eyebrow`-styled chip "Carta {state.usedCardIds.length}" in
the game screen header row next to the turn banner (it already tracks dealt
cards — no logic change).

## Commit 5 — Player tokens (`feat: player emoji tokens`)

The one reducer-adjacent change. Extend `Player` with `token: string` (emoji).
Change `START_GAME` payload from `playerNames: string[]` to
`players: { name: string; token: string }[]`; update `makePlayer`, all
`logic.test.ts` fixtures/helpers, `app.tsx` (`lastGame`), and both setup modes
(auto-assign from a curated 12-emoji pool — 🦊🦉🐢🐺🦁🐸🦜🐙🦔🐴🦩🐳 — with tap-to-cycle
or a small picker per player row; solo gets the first token). Render the token
in: turn banner, hand-off overlay ("Pasale el dispositivo a 🦊 Ana"),
round-end rows, results ranking, and (next commit) the race track. Keep
`aria-hidden` on decorative emoji.

## Commit 6 — Score race track (`feat(ui): score race track`)

The board-game centerpiece. New `src/components/score_track.tsx` replacing the
collapsible scoreboard **on the game screen** (scoreboard component stays for
round-end/results if useful): a horizontal felt rail from 0 to `targetScore`
with subtle tick marks (brass hairlines every point, numbered every 5), each
player's emoji token positioned at `score / targetScore` along it. Pending
points show as a ghosted/translucent copy of the token at
`(score + pendingPoints) / targetScore` — the push-your-luck stake made
visible. Current player's token gets a soft brass glow. Out-of-round players
(passed/failed) dim. Mobile: full-width rail below the plant button. Desktop
(`xl:`): keep the fixed top-right placement, vertical or horizontal as looks
best — screenshot both breakpoints and iterate. Tokens move with a CSS
transition (`transform`, ~400ms ease) so banking visibly *slides* the piece.

## Commit 7 — Points that travel (`feat(ui): banked points fly to the track`)

Connect dial → track. When a round ends (or a player banks via ¡Me planto!),
animate small brass peg dots from the dial/pending chip toward the player's
token on the race track: FLIP-style — measure source and target rects
(`getBoundingClientRect`), spawn 1 dot per banked point in a portal layer,
animate `transform` along a slight arc (~500ms, staggered 60ms), then remove
and let the track token slide (Commit 6's transition). Cap at 5 dots per bank.
Skip entirely under reduced motion (token still slides instantly). Play the
bank *clack* per dot landing (reuse sounds).

## Commit 8 — Turn timer, Modo Blitz (`feat: optional turn timer`)

Setup gains a "Ritmo" segmented row: **Relajado** (default, no timer) /
**Blitz** (20s per decision). UI-level only: a `useTurnTimer` hook in
`game.tsx` counts down while it's a player's decision window (playing phase,
no hand-off overlay, no dialog open — pause during both), resetting on
`currentPlayerIndex`/`revealedOptions` change. Visual: a thin brass progress
bar depleting along the top of the dial; final 5s ticks (sound) and the bar
shifts to `--color-wrong`. On timeout: auto-plant — dispatch `PASS` (banking
pending points) and show a brief "¡Se acabó el tiempo!" toast-style notice
(string in strings.ts). No reducer change. Persist the choice in `lastGame`
for replays. Timer must not run in solo hand-off-free flow differently — same
rules apply.

## Verification (end of plan)

Full CDP-driven playthrough at 390×844 and 1360×860: 3-player blitz game with
mixed deck — confirm sounds fire (check `AudioContext` state), suspense flip
visible, tokens race on the track, points fly on bank, timer auto-plants,
counter increments, and a solo game still flows without hand-offs. All gates
green. Update README (Cómo se juega + features list).

# CLAUDE.md, DEAD ENDS

Single-file top-down co-op zombie escape game. Live at https://tront.xyz/deadends/ (GitHub Pages, `main` root, `.nojekyll`).

## Read first

- `NOTES.md`: the handoff from the original ChatGPT sessions. Design intent, every system, performance history, past regressions, the do-not-touch list. It is authoritative on why things are the way they are. v14 is the canonical source; do not rebuild or reframework it.

## Rules

- One static HTML file. No bundler, no npm, no build step to play.
- The live AI match behind the main menu is sacred. No static splash, no concept art, no dashboard cards.
- Ending safehouse: stepping in is not safe. Sealing the red door is. Do not revert.
- Camera stays render-interpolated and locked. No spring follow.
- Persistent carnage stays. Never optimize by despawning bodies or blood.
- Canvas 2D stays until profiling proves a ceiling. Profile events; do not guess.
- Bots are GOAP planners. Do not simplify them into follow-and-shoot.
- Select then use with the mouse. No per-item bespoke keys.
- No em dashes in player-facing strings or docs. Discord links are `tront.xyz/discord/`.
- Online co-op is "experimental" until a real separate-network friend session succeeds. Never call BroadcastChannel or headless runs a multiplayer test.

## Workflow

1. Edit `index.html` in place. The menu version badge is the `DEAD ENDS · NN` string.
2. `node tools/verify.mjs` before any push. It boots the real page in headless Chrome, waits for Play Solo, screenshots the live menu, starts a solo run through `window.DEAD_ENDS`, simulates 5 s, reloads. All checks must pass.
3. Freeze a copy in `versions/` when a build is worth diffing against later.
4. Commit and push. Pages deploys from `main` in about a minute. Re-run `verify.mjs` against the live URL.

## Public hooks

`window.DEAD_ENDS`: `state` (phase, players, zombies, props, pickups, camera, net fields), `start()`, `setInvincible(v)`, `teleport(x,y,slot)`, `simulate(seconds)`, `aimAt(x,y)`, `shoot`, plus performance helpers `getPerformance()`, `exportPerformance()`, `resetPerformance()`, `warmSprites()`. Dev tools on `F2`, profiler on `F4`.

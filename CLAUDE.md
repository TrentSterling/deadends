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
- The public room is code `LOBBY` on a fixed PeerJS id; the v16 state machine reads `netStatus` strings from the host/join flows ("Room not found", "unavailable-id", "Online room ready"). Keep those strings if you touch hostRoom/joinRoom.
- Online co-op is "experimental" until a real separate-network friend session succeeds. Never call BroadcastChannel or headless runs a multiplayer test.

## Workflow

1. Edit `index.html` in place. Bump the `buildCredit111` string and `DEAD_ENDS.build`, add a `CHANGELOG.md` entry. New versions are appended as a block at the end of the script (the file is base game plus V4..V14, V18, V15, V16 layers that wrap functions by reassignment); in-place edits are fine when a single line owns the behaviour.
   - ChatGPT drops fork from v14 and never contain the co-op layers. When a new drop lands in `~/Downloads`, save it as `versions/dead_ends_vNN-chatgpt.html`, point `tools/polish-v18.py` (or a copy) at it, and rebuild `index.html` from it. The script aborts if any anchor is missing; fix the anchor, never hand-merge. Keep the v16 room namespace unless the wire format changes.
2. Before any push: `node tools/verify.mjs` (smoke, 17 checks), `node tools/campaign.mjs` (autopilot must win 5/5), `node tools/coop.mjs` (two Chromes over PeerJS, all checks), `node tools/lobby.mjs` (public room, 7 checks). Run the campaign against the previous frozen build too when a change touches routes, AI or the director. The harnesses run headless Chrome on the real GPU; v18's sprite grading takes minutes under SwiftShader (`GPU=0`), which is not a game bug.
3. Freeze a copy in `versions/` when a build is worth diffing against later.
4. Commit and push. Pages deploys from `main` in about a minute. Re-run `verify.mjs` against the live URL.
5. New v14 or later prop or run state that clients must see goes into the snapshot (`makeBaseSnapshot` prop rows, or a wrapper on `makeSnapshot` like v15's `seal`) and gets applied in the client state handler. The delta encoder compares rows by length and value, so appending a column is safe.

## Public hooks

`window.DEAD_ENDS`: `state` (phase, players, zombies, props, pickups, camera, net fields), `start()`, `setInvincible(v)`, `teleport(x,y,slot)`, `simulate(seconds)`, `aimAt(x,y)`, `shoot`, plus performance helpers `getPerformance()`, `exportPerformance()`, `resetPerformance()`, `warmSprites()`. Dev tools on `F2`, profiler on `F4`. v16 adds `quickPlay()`, `getLobby16()`; v15 adds `joinFromHash()`, `assignCallsign()`, `getV15()`, `getNet15()`; v14 adds `getV14()` (doors, seal, weapons) and `debugV14`. `sample()`, `startMap(n,seed)`, `setAuto(v)`, `selectMap`, `MAPS`, `press(key,v)`, `goMenu` drive the harnesses.

# CLAUDE.md, DEAD ENDS

Single-file top-down co-op zombie escape game. Live at https://tront.xyz/deadends/ (GitHub Pages, `main` root, `.nojekyll`).

## Read first

- `NOTES.md`: the handoff from the original ChatGPT sessions. Design intent, every system, performance history, past regressions, the do-not-touch list. It is authoritative on why things are the way they are. v14 is the canonical source; do not rebuild or reframework it.

## Rules

- One static HTML file. No bundler, no npm, no build step to play.
- The live AI match behind the main menu is sacred. No static splash, no concept art, no dashboard cards.
- Ending safehouse: stepping in is not safe. Closing the red door is. Left 4 Dead rules since 19.6: anyone inside can close it when the doorway is clear, anyone can reopen it from either side, and the chapter ends only when every survivor still alive is inside (downed outside means wait for the bleed-out). Do not revert to instant finish or to blocking on infected in the room.
- Camera stays render-interpolated and locked. No spring follow.
- Persistent carnage stays. Never optimize by despawning bodies or blood.
- Canvas 2D stays until profiling proves a ceiling. Profile events; do not guess.
- Bots are GOAP planners. Do not simplify them into follow-and-shoot.
- Select then use with the mouse. No per-item bespoke keys.
- No em dashes in player-facing strings or docs. Discord links are `tront.xyz/discord/`.
- Public play (v19) is 16 well-known rooms, `LOBBY` and `PUB02` to `PUB16`, four slots each, claimed by atomic PeerJS id election; same-origin tabs negotiate over BroadcastChannel first. `tools/lobby.mjs` accepts any of those codes as the host's room. The v16 single-room state machine is gone.
- Online co-op is "experimental" until a real separate-network friend session succeeds. Never call BroadcastChannel or headless runs a multiplayer test.

## Workflow

1. Edit `index.html` in place. Bump the `buildCredit111` string and `DEAD_ENDS.build`, add a `CHANGELOG.md` entry. New versions are appended as a block at the end of the script (the file is base game plus V4..V14, V18, V15, V16 layers that wrap functions by reassignment); in-place edits are fine when a single line owns the behaviour.
   - ChatGPT drops: check what they were built on before anything else. v15 to v18 forked from v14 and lacked the co-op layers (`tools/polish-v18.py` re-layered them); v19 was built on the shipped v18 (compare its stated base sha256 with `git show <commit>:index.html | sha256sum`). When a new drop lands in `~/Downloads`, save it as `versions/dead_ends_vNN-chatgpt.html`, copy the latest `tools/polish-vNN.py`, point it at the drop, and rebuild `index.html` from it. The script aborts if any anchor is missing; fix the anchor, never hand-merge. The shipped label is `NN.5` (ChatGPT's NN as hosted here). The wire check is `protocol19` in the welcome packet, not the build string.
2. Before any push: `node tools/verify.mjs` (smoke, 17 checks), `node tools/campaign.mjs` (autopilot must win 5/5), `node tools/coop.mjs` (two Chromes over PeerJS, all checks), `node tools/tracer.mjs` (drop-in client sees its own tracers after a reload, 4 checks), `node tools/safedoor.mjs` (Left 4 Dead door rules, 10 checks), `node tools/lobby.mjs` (public room, 7 checks). PeerJS ids are global: `lobby.mjs` really joins whoever is hosting `LOBBY`, so never run it while Trent is playing online; every other harness uses a private code. Run the campaign against the previous frozen build too when a change touches routes, AI or the director. The harnesses run headless Chrome on the real GPU; v18's sprite grading takes minutes under SwiftShader (`GPU=0`), which is not a game bug.
3. Freeze a copy in `versions/` when a build is worth diffing against later.
4. Commit and push. Pages deploys from `main` in about a minute. Re-run `verify.mjs` against the live URL.
5. New v14 or later prop or run state that clients must see goes into the snapshot (`makeBaseSnapshot` prop rows, or a wrapper on `makeSnapshot` like v15's `seal`) and gets applied in the client state handler. The delta encoder compares rows by length and value, so appending a column is safe.

## Public hooks

`window.DEAD_ENDS`: `state` (phase, players, zombies, props, pickups, camera, net fields), `start()`, `setInvincible(v)`, `teleport(x,y,slot)`, `simulate(seconds)`, `aimAt(x,y)`, `shoot`, plus performance helpers `getPerformance()`, `exportPerformance()`, `resetPerformance()`, `warmSprites()`. Dev tools on `F2` (v19 adds a Senses tab), profiler on `F4`. v19 adds `getNetwork()`, `getV19()`, `getPerception()`, `getInfectedMind(id)`, `quickPlay()`, `hostPrivate()`, `joinPrivate(code)`, `startRemix()`, `qa19.*` (render, noise, ray, use, setSandbox); v15 adds `joinFromHash()`, `assignCallsign()`, `getV15()`, `getNet15()`; v14 adds `getV14()` (doors, seal, weapons) and `debugV14`. `sample()`, `startMap(n,seed)`, `setAuto(v)`, `selectMap`, `MAPS`, `press(key,v)`, `goMenu` drive the harnesses.

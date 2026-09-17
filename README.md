# DEAD ENDS

A top-down co-op zombie escape game by Tront (Trent Sterling). Five chapters, four survivors, huge hordes, smart AI squadmates, and one last push to slam the safehouse door.

Play: https://tront.xyz/deadends/

Left 4 Dead pacing in a Flash-game body. Safe room to safe room. Reach the red door, get everyone inside, seal it. Online co-op is experimental; the AI fills empty slots.

## Files

| Path | What |
|---|---|
| `index.html` | The game. One file, no build step. Canvas 2D, procedural art and audio, GOAP squad AI, AI Director, PeerJS 1.5.5 from CDN for internet co-op. |
| `versions/` | Frozen prior builds (currently the v14 handoff build) kept for diffing and regression hunting. |
| `NOTES.md` | Tribal knowledge handoff from the original ChatGPT sessions: design intent, systems, performance history, regressions, do-not-touch list. Read it before changing anything structural. |
| `tools/` | Zero-dependency headless verification (Chrome DevTools Protocol from Node). |

## Controls

- `WASD` move, mouse aim, left click fire or use selected gear, right click or `Space` shove
- `1` `2` `3` firearm slots, `R` reload, `E` interact, revive, doors, objectives
- `G` throwables, `F` healing, `Q` quick gear, wheel selects, `Ctrl` + wheel zooms
- `V` drag a downed ally, `X` squad order, `Tab` map
- `F2` dev tools, `F4` profiler, `F8` 15 s capture, `F9` save report

## Verifying a build

```
node tools/verify.mjs                              # boots index.html headlessly, live menu + solo run + reload
node tools/verify.mjs https://tront.xyz/deadends/  # same against the live site
```

Screenshots and `verify.json` land in `tools/out/` (gitignored). It is a regression gate, not a playtest, and headless timing says nothing about real GPU performance.

## Credits

Made by Trent Sterling (Tront). Inspired by Valve and the Flash games we grew up playing. Not affiliated with Valve. Networking via [PeerJS](https://peerjs.com/).

More games at https://tront.xyz/games/. Discord: https://tront.xyz/discord/

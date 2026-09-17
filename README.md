# DEAD ENDS

A top-down co-op zombie escape game by Tront (Trent Sterling). Five chapters, four survivors, huge hordes, smart AI squadmates, and one last push to slam the safehouse door.

Play: https://tront.xyz/deadends/

Left 4 Dead pacing in a Flash-game body. Safe room to safe room. Reach the red door, get everyone inside, seal it. PLAY ONLINE drops you into the public room with whoever is there (or opens it if empty); private rooms use a code or invite link. The AI fills empty slots. Online co-op is experimental.

## Files

| Path | What |
|---|---|
| `index.html` | The game. One file, no build step. Canvas 2D, procedural art and audio, GOAP squad AI, AI Director, PeerJS 1.5.5 from CDN for internet co-op. |
| `versions/` | Frozen prior builds (v12, v13, v14 from the ChatGPT sessions) kept for diffing and regression hunting. |
| `CHANGELOG.md` | Per-version notes, v15 onward. |
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
node tools/verify.mjs                              # smoke: live menu, PeerJS, solo run, reload
node tools/verify.mjs https://tront.xyz/deadends/  # same against the live site
node tools/campaign.mjs                            # autopilot plays all five chapters, one row each
node tools/campaign.mjs versions/dead_ends_v14.html --port=9341   # compare against a frozen build
node tools/coop.mjs                                # two Chromes over real PeerJS: invite link, doors, seal, finish
node tools/lobby.mjs                               # public room: host alone, second tab, second browser, host loss recovery
node tools/og-shot.mjs                             # regenerates og-image.png from the live menu
```

Screenshots and JSON land in `tools/out/` (gitignored). These are regression gates, not playtests. Headless timing says nothing about real GPU performance, and two Chromes on one machine say nothing about internet latency.

## Credits

Made by Trent Sterling (Tront). Inspired by Valve and the Flash games we grew up playing. Not affiliated with Valve. Networking via [PeerJS](https://peerjs.com/).

More games at https://tront.xyz/games/. Discord: https://tront.xyz/discord/

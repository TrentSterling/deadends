# Changelog

## v19.6 (2026-09-19) Your own tracers, and a Left 4 Dead door

Two fixes from Trent's first two-window session on v19.5, both in `tools/polish-v19.py` on top of the same ChatGPT v19 drop.

- A client never saw its own tracers after its first reload (the host and other clients saw them fine). The reload countdown ends one step below zero and stays there, that value rides to the client in snapshots, and the client's predicted shot tested it for truthiness, so a reload of -1/60 blocked local prediction for the rest of the run. The muzzle flash and ammo still arrived from the host, which is why the gun looked alive. The countdown now clamps to zero and the check is numeric. This was v13-era code; it only became obvious once a second human played for a while.
- The destination safehouse door works like Left 4 Dead. v19 refused to close while any infected stood in the room and ended the chapter the instant the door shut. Now anyone inside can close it whenever the doorway itself is clear (a survivor or infected standing in the door still blocks it, with a prompt saying so). A closed door is solid, and any survivor can open it again from either side; bots walk up and open it. The chapter ends only when every survivor who is still alive is inside. Downed survivors outside keep the run going until they bleed out or get pulled in. Closing with teammates outside announces it. Infected cannot break the door. Host-authoritative; clients get door state through the existing seal rows, and now rebuild collision when it changes.
- Tooling: `tools/tracer.mjs` (drop-in client drains a clip, reloads, fires again; builds its own debug copy to count the client's predicted tracers; fails on 19.5, passes on 19.6) and `tools/safedoor.mjs` (10 checks: close with teammates outside, no early finish, reopen from outside, doorway block, bleed-out ends the chapter). Gates on this build: verify 17/17, campaign 5/5, coop 18/18, tracer 4/4, safedoor 10/10. The lobby gate was not run: it uses the real public rooms and Trent was playing in LOBBY at the time; the public-room code is untouched since 19.5 (7/7).

## v19.5 (2026-09-19) Living streets / one-click co-op

ChatGPT's v19, built on the shipped v18 this time (its base hash matches commit 3e8807d), so the v15 transport and the door and seal replication came along. v19 replaced the v16 public room with its own discovery. `tools/polish-v19.py` rebuilds `index.html` from `versions/dead_ends_v19-chatgpt.html` with the only two things that shipped after ChatGPT took its base: the reshot og-image meta and the 19.5 build label. Release notes, QA receipts and ChatGPT's own harness are in `chatgpt/v19/`.

- Public play: 16 well-known rooms (`LOBBY`, `PUB02` to `PUB16`), four slots each. PLAY ONLINE joins the first room with a free slot or claims one; full squads spill into the next room. Same-origin tabs still meet over BroadcastChannel first. A discovery failure says "Local tabs only" instead of pretending to be global. Room namespace is v19; every machine must run this build (the welcome packet checks `protocol19`).
- World epochs and client-ready acknowledgments: AI keeps a survivor until the joining browser has a world and keyframe, then hands it over. Stale inputs and previous-world snapshots are rejected. Fragment count, size and lifetime are bounded; malformed packets request recovery.
- Preparation is live simulation. Weapons, hazards, damage and rescue keep working in the starting safehouse; only the Director's pacing and the chapter clock wait for departure. The starting shutter has a barred firing port: bullets pass the aperture, bodies and thrown items do not.
- Infected senses: a shot alerts nearby infected only; idle infected wander, turn toward sounds, chase what they can see, investigate remembered positions and lose interest. Director mobs still pursue as directed pressure. F2 has a Senses tab.
- The destination door really closes. Sealing needs a clear room and threshold; a downed or interrupted closer cancels the seal instead of granting a false win. Bot closers stay at the mechanism.
- Found heavy rifles and auto shotguns persist across chapters and Continue; ammo pickups respect upgraded clip sizes. Special interrupts need a legal, in-range, unobstructed shove.
- Stereo sound buses, distinct special tells and gun reports, a two-stage safehouse slam and latch. A hidden-host timer keeps the authoritative simulation running without rendering.
- Tooling: `tools/lobby.mjs` reads v19's `getNetwork()` and accepts any public room code; `tools/cdp.mjs` launches Chrome with `--mute-audio` (v19's sound buses played through the speakers during headless runs). Gates on this build: verify 17/17, campaign 5/5, coop 18/18, lobby 7/7 (host loss recovered in 3.7 s versus 13 s on v16).

## v18 (2026-09-19) Readable by design

ChatGPT's visual overhaul (its v15 readability pass, v17 environment art and chapter identity, v18 baked materials) merged onto the live v16 line. ChatGPT forked from v14, so its drops carry none of the co-op fixes; `tools/polish-v18.py` rebuilds `index.html` from the raw drop (`versions/dead_ends_v18-chatgpt.html`) plus every v15 and v16 edit and block. Wire format is unchanged, so the room namespace stays `v16`.

- Environment materials (floors, walls, roofs, room dressing, the bridge water mask) are authored per chapter theme and baked once into the world canvas, below actors and hazards. This replaces the stacked transparency wrappers of the v15 to v17 drops.
- Cached sprites (props, bodies, stains, fragments) are colour graded once at bake time instead of being drawn at reduced alpha, so solid objects stay solid and survivors outrank debris after big explosions. Fresh pools stay vivid; the baked layer uses dried, darker stains. Kill, corpse and stamp counts are not reduced.
- Survivors have four large coat panels and a bright head read; infected have ragged asymmetric silhouettes with one shape per attack. Pickups are physical items instead of token circles and label stacks.
- Visual diagnostic views under F2 dev tools: normal, values, actors, environment, silhouette, plus a labels toggle (`DEAD_ENDS.setVisuals(view, labels)`, `DEAD_ENDS.getVisuals()`).
- Everything from v15 and v16 is present: base64 plus chunked PeerJS transport, replicated doors and seal, invite links, callsigns, social meta, PLAY ONLINE public room, em dash sweep.
- Tooling: the sprite grading reads every cache back through `getImageData`, which takes minutes under SwiftShader, so `tools/cdp.mjs` now launches headless Chrome on the real GPU (ANGLE d3d11) by default; `GPU=0` restores software rendering. Gates on this build: verify 17/17, campaign 5/5, coop 18/18, lobby 7/7.
- Hardware acceleration is required for now. CPU-backed caches fix the boot but then draw at 0 fps under software GL, and a CPU-paint plus one-time GPU copy did the same, so the experiment was dropped rather than chased.
- og-image.png reshot from the v18 menu (fire, blood, squad) with `tools/og-shot.mjs`; social meta bumped to `?v=2` so cards refetch it.

## v16 (2026-09-17) Public room

- PLAY ONLINE on the main menu. It looks for the always-on public room (code `LOBBY`), joins it if someone is there, otherwise hosts it and starts the run at once so later arrivals drop in mid-chapter. Two tabs with no code and no link land in the same game in about a second (BroadcastChannel); a second browser or machine joins over WebRTC in about three.
- Private rooms still work exactly as before: HOST WITH A CODE, the code box, and invite links. The co-op panel puts the public room first and the private tools underneath.
- Public guests never sit on the "host disconnected" screen. If the public host closes the tab, the remaining players go back to the menu on their own and one of them re-hosts the room while the others rejoin (about 13 s in the harness, dominated by WebRTC close detection).
- Room namespace bumped to v16.
- Tooling: `tools/lobby.mjs` (tab hosts alone, second tab joins locally, separate browser joins mid-run, host closes, survivors recover), `tools/polish-v16.py` (the exact patch on the frozen v15), `tools/cdp.mjs` gained same-browser sibling tabs.

## v15 (2026-09-17) Co-op polish

First build made after the game went live at https://tront.xyz/deadends/ and the first real two-player session.

- Online co-op actually runs. Two pre-existing v13 defects meant a PeerJS client saw the world load and then nothing ever moved: the binary zombie rows (ArrayBuffers) did not survive the JSON data channel, so the client rejected every state packet, and keyframes (~26 KB) exceeded the 16 KB limit of that channel, which raised an error the host treated as a disconnect ("AI TAKES OVER" while the player was still connected). v15 carries the buffers as base64 and splits big packets into chunks that the far side reassembles. BroadcastChannel tab tests never showed either problem because structured clone keeps binary and has no size cap.
- Host no longer throws out of its update when a zombie spawns between keyframes (the delta encoder compared against a missing base row).
- Invite links work. The copied link ends in `#join=CODE`; nothing in v14 read that hash, so a friend clicking it landed on the plain menu. v15 opens co-op and joins the room on load (and on hash change), then clears the hash. If a run is in progress it says so instead of interrupting.
- Tactical doors replicate. Snapshots carried only `destroyed` and `hp` for props, so a client kept its own idea of which v14 doors were open. Clients would walk into a door the host had opened, or through one the host had shut, until the next position correction. The prop row now carries the open flag and clients update collision when it changes.
- Safehouse seal replicates. The host's seal progress rides in every snapshot, so clients see the red door swing shut, get the SEALING notice and the roster state, instead of the chapter ending with the door still open on their screen.
- Callsigns. Everyone defaulted to SURVIVOR, which the roster truncated to SURVI... and made two humans indistinguishable. First-time players get a random short callsign (still editable, still saved), and the roster column is wider.
- Room namespace bumped to v15 so stale tabs on v13 or v14 cannot join a mismatched host.
- No em dashes in player-facing strings, titles or meta. Code comments untouched.
- Social meta: canonical URL, `og:url`, `og:image` (1200x630 render of the live menu), Twitter large card.
- Repo tooling: `tools/verify.mjs` (smoke), `tools/campaign.mjs` (autopilot five-chapter run for regression comparison), `tools/coop.mjs` (two headless Chromes over real PeerJS, invite link join, door and seal agreement, finish on both sides), `tools/og-shot.mjs`, `tools/polish-v15.py` (the exact patch applied to the v14 file).

Regression check before v15 was written: the autopilot campaign clears all five chapters on v13 and on v14 with the same seed (70 to 130 s each, zero console errors), so v14 did not break routes. Its gap was that its new door and seal state never reached co-op clients, on top of the v13 transport defects above.

## v14 (ChatGPT) Combat and escape polish

Destination safehouse stays dangerous until the door is sealed, reusable tactical doors, R7 heavy rifle and auto shotgun finds, brute and screamer shove interrupts, bot cover behaviour. See `NOTES.md`.

## v13 (ChatGPT) Research applied

Single durable terrain raster, bounded telemetry, versioned portable saves, rebinding and quick wheel, seeded Remix conditions, keyframe-relative binary replication.

## v12 (ChatGPT)

Seeded Remix, run codes, local records.

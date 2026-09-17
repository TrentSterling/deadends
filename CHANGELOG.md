# Changelog

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

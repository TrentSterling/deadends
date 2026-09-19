# DEAD ENDS v19 — Living streets / one-click co-op

Made by Trent Sterling / Tront. Built directly from the supplied Claude-edited v18.5 (`index(8).html`), not from an older ChatGPT build.

## Play and publish

Open `dead_ends_v19.html` for solo play, or put the identical `index.html` from the release ZIP at `https://tront.xyz/deadends/`. This package does not publish anything automatically. Keep the site's existing `og-image.png`; no replacement social image is bundled.

- **Play solo:** immediate, offline-capable gameplay with three AI survivors.
- **Play online:** joins an available public squad or opens one automatically. No code entry. Full squads spill into the next public room.
- **Private room:** explicit host/start flow, code and direct `#join=CODE` links.
- All members must use **v19**. Its world/replication namespace is intentionally separate from v18.5.

Global discovery uses the existing optional PeerJS service. There are 16 well-known public room IDs, each with four survivor slots. These are browser-hosted squads, not dedicated always-on servers. Same-origin tabs can communicate directly with BroadcastChannel. A discovery failure explicitly reports **Local tabs only**; it is not presented as a globally reachable room. Public host loss starts matchmaking for a **new** round, not migration of the previous fight. Network restrictions can still prevent WebRTC connectivity. Keep a host browser running.

## Safehouse and infected behavior

Preparation is now live simulation. Weapons, ammunition, equipment, grenade fuses, hazards, damage and rescue continue while the Director's automatic pacing and chapter clock wait for departure.

The starting shutter has a visible barred firing port. Bullet and sight rays can pass through the center aperture; steel panels block them, and bodies, melee, thrown items and acid do not pass through the closed door. Opening the shutter allows infected in. The safe room is protected by its geometry, not a blanket invulnerability rule.

A shot can alert nearby infected. Distant ones do not receive the player's position merely because a trigger was pulled. Idle infected wander and pause, turn toward nearby sounds, pursue visible survivors, investigate remembered positions and eventually lose interest. Explicit Director mobs still pursue the squad as directed pressure. Gunfire alone does not create a timed horde during preparation, but a car alarm or Screamer can call a forced mob. Opening the door does not erase already queued forced enemies.

The destination has a real closing door. Seal it from nearby, with the room and threshold clear. A downed/blocked/interrupted closer cancels sealing instead of granting a false victory. The automated squad's closer stays at the mechanism rather than starting to close and walking away.

## Integration and presentation changes

- Preserved Claude's JSON-safe base64 infected buffers, 8K JSON fragments, missing-baseline guard, tactical-door state, final-seal state and invite-link behavior.
- Added world epochs and client-ready acknowledgments. AI holds a survivor until the joining browser has a world/keyframe, then hands it over. Stale inputs and previous-world snapshots are rejected.
- Bounded incoming fragment count/size/lifetime; malformed packets request recovery instead of silently stalling the match.
- Found heavy rifles and auto shotguns persist through chapter changes and save/Continue. Ammo pickups respect upgraded clip sizes. Old checkpoints remain accepted with no upgrade flags.
- Special interrupts now require a legal, in-range, unobstructed shove; holding shove during cooldown cannot silently cancel a special.
- Shared stereo sound buses, distinct special tells and upgraded-gun reports, metal/wood impacts and a two-stage safehouse slam/latch.
- **F2 → Senses:** inspect actual ambient/hunt/investigation state, remembered targets, sound stimuli and shared goal fields. Visualizers stay off during ordinary play.
- **F4 / F8 / F9:** view, capture and export profiling, now labeled v19 consistently.
- A hidden-host timer runs the authoritative simulation without rendering. This branch was exercised in the harness; OS/browser suspension is still outside the game's control.

## Preserved

The five Classic chapters, seeded Remix options, v18 procedural artwork and readability, cached infected animation, persistent blood/bodies, locked interpolated camera, equipment controls, GOAP squad, public-facing Tront branding and compact live-menu layout remain. No framework, game-server backend, new art CDN, or renderer rewrite was introduced.

## QA and limits

See `dead_ends_v19_qa.json` and the test pack for exact results. Tests distinguish real native BroadcastChannel, simulated Peer-compatible JSON transport, deterministic game-controller tests, and native-rAF frame captures.

A native RTC loopback attempt exchanged SDP but produced no ICE candidates in this managed browser (non-proxied UDP disabled). It was **not** converted into a claim of successful WebRTC. Separate-network PeerJS/NAT testing remains essential. The JSON test broker exists only in the QA pack and is not included in the game.

Browser URL navigation was restricted, so the harness loaded the complete HTML using `set_content`. Portable save round-trips and legacy/invalid imports were tested; normal-origin browser-close/reopen persistence was not. Screenshots and clips are captured from the real renderer. Some targeted door/weapon/replication tests place actors or change props as explicit fixtures; chapter walkthroughs use normal navigation/objectives without forced gates or teleporting.

Performance results are headless Linux Chromium CPU/submission and frame intervals, not GPU timings and not estimates for Trent's Windows 5070 Ti.

## Claude continuation checklist

1. Deploy a copy of v19 as `/deadends/index.html`, keeping the previous deployed build available to roll back.
2. Test a two-device, two-network public join and a private invite. Then try four humans, chapter advance, late joining, host departure, and a reload/Continue save check on the HTTPS origin.
3. Preserve base64 conversion and fragmentation on JSON transport. BroadcastChannel alone will not catch loss of ArrayBuffer data during JSON serialization.
4. Do not restore staging weapon suppression or freeze the zombie update loop. Only automatic pacing waits for departure; triggered consequences remain active.
5. Keep simulation-only diagnostics out of the normal HUD. Preserve v18's actor/environment separation and cache architecture.
6. Use the paired source/hash and QA receipts to review future changes. No internet multiplayer certification, native GPU guarantee, or full world host migration is claimed by this release.

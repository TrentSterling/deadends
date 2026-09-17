# DEAD ENDS — HANDOFF / TRIBAL KNOWLEDGE
## From ChatGPT → Claude
## Current canonical build: dead_ends_v14.html
## Intended public URL: https://tront.xyz/deadends/

You are taking over DEAD ENDS from a long iterative design/dev session with Trent Sterling / Tront.

IMPORTANT: Treat v14 as the canonical source of truth. Do not rebuild it from scratch. Do not "clean it up" into a framework unless there is an actual reason. The weird accumulated code has a lot of hard-won behavior in it.

The immediate assignment is:
1. Understand v14.
2. Preserve what works.
3. Get it online at tront.xyz/deadends/.
4. Continue development from there without regressing the game.

This document is the tribal knowledge you would otherwise be missing.


============================================================
1. WHAT DEAD ENDS IS
============================================================

DEAD ENDS is a compact top-down cooperative zombie escape game.

Think:
- Left 4 Dead's safe-room-to-safe-room structure and pacing philosophy.
- Old-school browser / Flash-game immediacy.
- Detailed modern procedural programmer art.
- Four survivors.
- Huge hordes.
- Smart AI teammates when human slots are empty.
- Get through the level alive and SLAM THE SAFEHOUSE DOOR.

It is NOT primarily:
- a wave-defense game,
- a base-building game,
- an extraction metagame,
- a roguelite grind,
- a progression treadmill,
- a giant content production.

The fantasy Trent likes most is:
"We barely fucking made it into the safe room."

That feeling is the north star.

Some maps have event sequences / temporary defensive moments, just like L4D, but the game is fundamentally about PUSHING FORWARD and ESCAPING.


============================================================
2. PROJECT / AUTHOR BRANDING
============================================================

Made by:
Trent Sterling / Tront

Primary hub:
https://tront.xyz/

Games:
https://tront.xyz/games/

Discord:
https://tront.xyz/discord/

The game should visibly but tastefully say "Made by Tront" and backlink to tront.xyz.

Broad inspiration credit currently used:
"Valve and the Flash games we grew up playing."

Do NOT call it an official Valve project.
Do NOT claim affiliation or endorsement.
Do NOT name random Flash games as direct inspirations unless Trent specifically decides to.

Trent was actually a Flash-game developer for years, so the Flash-game visual/gameplay connection is intentional and personal, not an insult.


============================================================
3. DISTRIBUTION PHILOSOPHY
============================================================

The game is intentionally a SINGLE STATIC HTML FILE.

That is a feature.

Current goal:
- Host as something like /deadends/index.html
- Reach it via https://tront.xyz/deadends/
- No build pipeline should be required to PLAY the game.
- Avoid introducing npm/framework/build-system dependency unless Trent explicitly approves it.
- Keep the downloadable/single-file version viable where practical.

Online co-op is optional infrastructure layered on top.

The HTML contains:
- game code,
- procedural graphics,
- UI,
- maps,
- generated/synthesized audio,
- AI,
- gameplay systems.

PeerJS is used for internet multiplayer and may load from CDN.
BroadcastChannel is used for local same-origin/multi-tab multiplayer testing.


============================================================
4. CURRENT GAME CONTENT — V14
============================================================

There are five chapters:

01 THE LAST BLOCK
   Mercer District

02 BURNOUT
   Cinder Gas & Auto

03 LAST TRAIN
   Ashline Underground

04 CODE RED
   Saint Arden Hospital

05 DEADWEIGHT
   Blackwater Crossing

Every chapter:
- begins in a closed SAFE starting room,
- does not activate the Director/run until players leave,
- contains supplies,
- has forward traversal,
- has some map-specific interaction/event,
- ends at a destination safehouse.

Campaign progression carries survivor condition/items between chapters under existing recovery rules.

There is also seeded REMIX functionality added before v14:
- alternate authored route arrangements,
- changing supplies,
- changing encounters,
- encounter profiles,
- deterministic challenge/run codes,
- local records,
- no dumb HP scaling.

Classic should remain the authored baseline.


============================================================
5. SAFEHOUSE DESIGN — VERY IMPORTANT
============================================================

This system has been repeatedly refined.

STARTING SAFEHOUSE:
- Truly safe.
- Horde/Director should not begin just because the chapter loaded.
- Exit door starts sealed.
- Players prepare, grab supplies, then leave.
- First real departure starts the run.
- Bots do NOT start the run by opening/leaving without the human.

ENDING SAFEHOUSE:
This changed in v14.

Simply stepping into the ending room DOES NOT grant magical immunity anymore.

The desired sequence is:

RUN LIKE HELL
→ get squad inside
→ enemies can still threaten you through the open entry
→ interact with the red safe-room door
→ door closes
→ NOW you are safe
→ chapter completes

The safe-room slam is meant to be emotionally important.

If survivors are still outside, the game has existing logic allowing the player to eventually abandon stragglers with a longer interaction.

Do not casually revert ending-safe-room damage immunity.


============================================================
6. V14'S NEW COMBAT / LEVEL SYSTEMS
============================================================

V14 introduced TACTICAL DOORS.

These are reusable doors rather than one-shot breakables.

They can:
- open with E,
- close with E,
- block players/zombies when closed,
- be attacked by infected,
- be destroyed,
- block fire/LOS appropriately,
- refuse to close through actors.

Design intent:
Run into a side building.
Close the door.
Reload / heal / revive.
Hear zombies smashing it.
Escape before it breaks.

Mercer already had authored closed doors.

Other maps got connector tactical doors, but IMPORTANTLY those generally START OPEN so they don't break known route traversal.

Bots:
- may open tactical doors when they need to traverse them,
- should NOT randomly close doors and trap everybody.


============================================================
7. V14 WEAPON FINDS
============================================================

The base gun roster originally had:
- M4 / carbine
- pump shotgun
- 9mm sidearm

V14 adds meaningful weapon finds without adding more number-key clutter.

R7 HEAVY RIFLE:
- high damage
- deliberate fire rate
- long range
- large knockback
- strong multi-target penetration
- limited magazine
- intended as "line up the horde / murder the special" weapon

AUTO 12 GAUGE:
- aggressive crowd-clear shotgun
- much faster follow-up fire than pump
- burns ammo quickly
- emergency weapon, not a permanent god gun

These REPLACE an existing weapon slot rather than creating slots 4, 5, 6, 7.

That philosophy is intentional.

Side rooms should sometimes reward:
"Holy shit, there's a weapon in there that changes how this run plays."

Not:
"+4% damage purple rifle."


============================================================
8. SPECIAL INFECTED / COUNTERPLAY
============================================================

Current special types include variants such as:
- runner
- brute / charger-like threat
- spitter
- leaper / pinner
- screamer

Exact names/types live in source.

V14 strengthened readable attack tells:
- Brute charge windup
- Leaper commitment/windup
- Screamer warning/call

V14 also added shove-based interrupts for some major attacks:
- well-timed shove can interrupt a Brute charge
- well-timed shove can interrupt a Screamer call

General design principle:
Dangerous actions should have:
POSE + SOUND + WORLD READABILITY

Counterplay should be immediately legible.

Do not solve clarity by dumping more permanent text into the HUD.


============================================================
9. SHOVE IS IMPORTANT
============================================================

Shove is not filler.

It should be useful for:
- peeling commons,
- making breathing room while reloading,
- rescuing teammates,
- interrupting certain specials,
- controlling emergency spacing.

Right mouse / Space have historically been tied to shove behavior depending on control revision.

Avoid making shove inconvenient.


============================================================
10. CURRENT CONTROL PHILOSOPHY
============================================================

Controls went through several revisions because Trent hated having one bespoke keyboard key for every item.

The preferred modern scheme is SELECT → USE WITH MOUSE.

Current broad model:
- WASD: move
- mouse: aim
- left click: firearm/use selected equipment
- right click / Space: shove
- 1 / 2 / 3: firearm slots
- R: reload
- E: interact/revive/doors/objectives
- Tab: map
- Q: weapon/equipment quick behavior
- G: throwable selection / cycle
- F: healing selection
- mouse wheel: selection based on configured preference
- Ctrl + wheel: zoom
- V: drag downed ally
- X: contextual squad order
- F2/F4/F8/F9: dev/performance functions

V13 also added:
- rebinding
- optional hold-Q equipment wheel
- scroll preference (guns-only vs all equipment)

Do NOT revert to:
G = pipe bomb
C = Molotov
F = self heal
H = teammate heal
plus twelve other random action keys

Trent specifically liked the newer L4D-ish selection approach.


============================================================
11. DOWNED / RESCUE GAMEPLAY
============================================================

Downed survivors:
- bleed out,
- can use a pistol,
- can be revived,
- can be dragged,
- bots can revive,
- emergency rescue behavior overrides less important bot plans.

Dragging downed players was deliberately added because helping should involve physical/gameplay verbs, not just abstract UI.

Pins by some specials can require teammates to shoot/shove the attacker off.

This is core co-op texture.


============================================================
12. AI — THIS IS A REAL SYSTEM, NOT FOLLOWER BOTS
============================================================

The bots became a major successful feature.

They use a GOAP-style planning layer.

GOAP decides WHAT they should do.
Navigation/pathing handles HOW they get there.

Bots can plan things such as:
- fight threats,
- cover,
- rescue,
- fetch supplies,
- heal,
- heal allies,
- move toward objectives,
- regroup,
- operate objectives,
- react to special infected,
- open doors.

There are claims/reservation systems so all three bots don't dogpile the exact same supply/action.

Emergency hierarchy matters:
PINNED / DOWNED TEAMMATE
should trump
NORMAL ADVANCE / LOOTING

V14 added more coordination around cover:
If a survivor is:
- healing,
- healing someone else,
- or sealing the final safehouse,

nearby teammates may choose COVER instead of blindly advancing.

Bots also prioritize important special situations.

Existing targeting logic especially values:
- a leaper actively pinning somebody,
- screamers actively calling,
- threats endangering vulnerable teammates.

Do not simplify bots back into:
"move toward player and shoot nearest zombie."

The menu literally showcases the AI playing the game by itself.


============================================================
13. THE LIVE MAIN MENU IS SACRED
============================================================

Originally we tried normal game-menu presentation.

Eventually the solution became:
THE ACTUAL GAME PLAYS ITSELF BEHIND THE MENU.

This was a major improvement and Trent loves it.

The menu background:
- runs an AI squad,
- uses actual procedural game rendering,
- can show hordes/fights,
- demonstrates GOAP,
- creates atmosphere without separate marketing assets.

Do NOT replace this with:
- generic static gradient,
- stock zombie splash,
- generated concept art,
- giant card-dashboard UI.

There was concept art at one point, but it had anatomy issues and was ultimately replaced by live gameplay.

The current philosophy is:
THE GAME IS ITS OWN MENU ART.

Keep menu UI simple and let the simulation sell the game.


============================================================
14. UI STYLE — IMPORTANT
============================================================

Trent strongly rejected earlier "AI slop UI."

Avoid:
- giant rounded dashboard cards,
- excessive glassmorphism,
- random tiny labels everywhere,
- decorative metrics,
- meaningless "ACTUAL GAMEPLAY" captions,
- every corner containing text,
- app/dashboard aesthetic,
- icon-only controls with mystery hover behavior.

Preferred:
- strong readable typography,
- simple left-side menu,
- visible text labels,
- restrained red accent,
- survival-game feeling,
- clean HUD,
- only information that matters.

HUD priorities:
1. objective
2. squad health/state
3. weapon/ammo/equipment
4. current contextual action

Anything else should usually be contextual/fading/dev-only.


============================================================
15. VISUAL STYLE / ART DIRECTION
============================================================

A huge amount of art polish happened.

Early visuals were "passable programmer art."
Trent explicitly pushed for the sort of polish jump where simple primitives become deliberately modeled/detail-rich forms.

Current desired look:
- recognizably Flash-game / browser-game
- stylized
- BUT made by a skilled detailed artist
- not baby-simple circles/rectangles
- not emoji fire
- good silhouettes
- readable from top-down
- grime/details without obscuring gameplay

Important polish work already completed:
- detailed vehicles
- fuel pumps
- props
- player character silhouettes
- infected silhouettes
- more authored weapons
- persistent blood
- better corpses
- richer fire
- smoke/scorch/glass/debris
- muzzle effects
- better materials/details

Keep style consistent with current v14.

If you redo an asset:
MAKE IT CLEARLY BETTER.
Compare before/after yourself.

Don't "change style" and call that improvement.


============================================================
16. GORE / AFTERMATH
============================================================

Persistent carnage is a FEATURE.

Bodies and blood stay through the chapter.

Trent likes looking back after a huge fight and seeing that the street remembers what happened.

Do NOT optimize performance by simply:
- despawning all bodies,
- removing blood,
- reducing the game to clean circles.

Previous optimization work caches/bakes settled aftermath so it can remain visible cheaply.

There are gore settings, but Carnage is the intended/default presentation.


============================================================
17. FIRE / MOLOTOVS
============================================================

Molotovs originally looked awful:
the fire simply "pooped into place" as cartoon flame sprites.

They were rebuilt with:
- thrown bottle arc
- tumbling bottle
- rag
- trail/embers
- shatter
- ignition spreading outward
- growing damage area
- animated uneven fire
- smoke
- scorch marks
- glass
- lighting
- wall-aware behavior

Fire was revised multiple times because visible sprite repetition looked cheap.

Maintain irregular, broken-up fire fields.

Avoid giant repeated emoji-style flame icons.


============================================================
18. MAP DESIGN / CORE LOOP
============================================================

The fundamental loop is:

SAFE ROOM
→ open door
→ MOVE
→ explore optional resources
→ encounter pressure
→ react to Director
→ map-specific event
→ desperate final push
→ SAFE ROOM
→ close the door

Maps should give players reasons to:
- push,
- temporarily retreat,
- detour,
- use doors,
- decide whether supplies are worth risk,
- save each other,
- spend throwables now vs later.

Don't accidentally turn levels into stationary survival arenas.

The game is best when momentum changes but forward progress remains the objective.


============================================================
19. REMIX / REPLAYABILITY
============================================================

Trent beat the entire campaign and immediately noticed weak replayability.

V12/V13 introduced seeded Remix.

Core principle:
VARIATION SHOULD CREATE DIFFERENT DECISIONS.

Not:
"Zombie health +40%."

Existing Remix concepts include:
- alternate authored routes
- shuffled but reachable supplies
- encounter compositions
- special-infected lineup variation
- supply economy profiles
- challenge/run codes
- deterministic seeds
- local records
- optional risk/reward supply situations

Keep mandatory objectives reachable.

Starting safe-room supplies should be dependable enough that a Remix seed can't simply screw the player before leaving.

Future good replay additions:
- richer encounter grammar
- optional dangerous loot rooms
- distinct Director personalities
- challenge seeds
- all-survivor / no-incap records
- more authored route variants

BAD future additions:
- XP treadmill
- arbitrary loot rarity
- bullet sponge scaling
- giant upgrade tree pasted over a 10-minute arcade game


============================================================
20. AI DIRECTOR
============================================================

The Director is inspired by pacing concepts from Left 4 Dead but implemented for this top-down game.

General pacing states have included concepts like:
BUILD
PEAK
FADE
RELAX

The important behavior:
- pressure rises,
- fight peaks,
- pressure can subside,
- players get recovery windows,
- scripted level events can override normal pacing.

Constant maximum chaos gets boring and unreadable.

Recovery is necessary to make the next spike hit harder.

The Director also controls/assists:
- hordes
- special pressure
- forced event pressure
- contextual pacing

Dev tools can expose Director state.

Don't turn difficulty into nonstop spawning.


============================================================
21. NAVIGATION / CROWD AI
============================================================

DO NOT assume the zombies are each independently running A* every frame.

Previous profiling specifically established that pathfinding was NOT the main performance problem.

Current systems use:
- shared flow fields for hordes
- flow reuse
- spatial hashing / broadphase
- normal LOS where direct movement works
- more specific pathing for appropriate actors/bots

This is already directionally correct.

Avoid replacing efficient shared crowd navigation with per-zombie expensive pathfinding.


============================================================
22. PERFORMANCE HISTORY
============================================================

Performance has been repeatedly profiled.

Important historical finding:
SIMULATION WAS OFTEN CHEAP.
RENDERING / AFTERMATH / BROWSER TIME WAS MORE SUSPICIOUS.

Example historical captures showed:
~5 ms p95 measured CPU work
while actual frame intervals could be ~33 ms p95.

Meaning:
large portions of frame delay occurred OUTSIDE the explicitly measured JS scopes.

Possible areas:
- raster
- compositor
- browser scheduling
- GPU/resource upload
- headless-test timing behavior
- etc.

Do NOT simply say:
"It's GPU bound"
unless you actually prove that.


============================================================
23. PIPE-BOMB HITCH — MAJOR FIX HISTORY
============================================================

At one point a pipe bomb killing a giant pile of zombies caused a huge hitch.

An isolated 180-ish enemy blast showed over 100 ms in explosion/death aftermath work.

Optimization work included:
- caching blood/body artwork
- batching/limiting redundant death audio
- spatial enemy queries
- batching nav rebuild effects
- cheap broadphase before narrow phase
- baking aftermath efficiently

This produced huge wins in isolated tests.

Do not casually remove these optimizations.

If a new blast hitch appears:
PROFILE THE EVENT.
Do not guess.


============================================================
24. V13 MEMORY / TERRAIN WORK
============================================================

Research found the game could retain:
- a huge monolithic world raster
AND
- tiled copies of the same terrain.

V13 changed terrain lifetime so the giant source raster can be released once tiled terrain is prepared.

The purpose was to reduce retained raster backing memory substantially.

Do not reintroduce permanent duplicate copies of the entire map unless there is measured justification.

Persistent body/blood tiles should remain.


============================================================
25. CANVAS 2D IS INTENTIONAL FOR NOW
============================================================

The renderer is Canvas 2D.

We researched:
- Canvas2D optimization
- WebGL2
- WebGPU
- Workers
- WASM

Conclusion was NOT:
"Rewrite in WebGPU."

Current approach:
KEEP CANVAS 2D until profiling demonstrates a clear reason not to.

A future WebGL2 batched sprite renderer could be worth prototyping if actual raster/GPU profiling shows a meaningful ceiling.

But do not rewrite the whole game as part of deployment/polish.


============================================================
26. CAMERA
============================================================

Camera follow used to chase the player with smoothing.

Trent noticed judder.

We measured it.

It was changed to a render-interpolated locked camera.

Default should feel essentially anchored to player movement with optional aim offset.

Simulation is 60 Hz.
Rendering interpolates between simulation positions.

This fixed high-refresh judder across tested frame cadences.

Do NOT casually reintroduce spring-follow camera smoothing.

Screen shake defaults were also toned down / made configurable because shake can make smooth movement look bad.


============================================================
27. DEVELOPER / PROFILER TOOLS
============================================================

There are substantial internal developer tools.

Useful hotkeys have included:

F2 — Developer tools / visualizers
F4 — Live profiler
F8 — Begin/end ~15-second performance capture
F9 — Save performance report

Dev tools can visualize/inspect things such as:
- GOAP goals
- GOAP action plan
- selected bot
- targets
- perceived enemies
- LOS
- flow field
- navigation cells
- collision
- spatial hash occupancy
- Director state
- hazards
- performance
- explosion events
- deterministic lab setups
- sandbox/invulnerability
- pause / simulation stepping
- metrics

ALT-click agent selection existed in one developer pass.

There are deterministic pipe-bomb stress fixtures for roughly:
80
160
240
infected.

Developer-mode mutations should NOT overwrite legitimate campaign checkpoints.


============================================================
28. PERFORMANCE TEST PHILOSOPHY
============================================================

Do not optimize by eyeballing Task Manager.

Good tests include:
- normal active fight
- 80 enemy pipe bomb
- 160 enemy pipe bomb
- 240 enemy pipe bomb
- fire chain reaction
- 900 settled bodies + ongoing combat
- first-use versus warmed art
- live menu running for a while
- chapter transition
- camera traversal
- co-op snapshot stress

When possible compare:
BASELINE vs CANDIDATE
same seed
same viewport
same gameplay state
same number of frames

Record:
- frame interval p50/p95/p99/max
- measured CPU work
- simulation
- effects
- rendering submission
- long frames
- enemy count
- body count
- fire count
- flow rebuilds
- cache misses
- memory estimates
- network bytes

And IMPORTANT:
Headless Chromium benchmarks are regression comparisons.
They are NOT the same thing as Trent's Windows/5070Ti performance.


============================================================
29. NETWORKING
============================================================

Networking has not received enough real-world human testing yet.

Architecture:
- host-authoritative simulation
- clients send input
- host simulates combat/director/loot/objectives
- snapshots/events return to clients
- PeerJS/WebRTC for internet discovery/data
- BroadcastChannel for local multi-tab tests
- AI fills empty player slots
- disconnecting a player can return slot to AI

V13 added work to reduce giant repetitive snapshots:
- compact infected state records
- keyframe-relative deltas / resync concepts
- application byte telemetry

Do not trust only synthetic local tests.

IMPORTANT deployment goal:
Once hosted at HTTPS tront.xyz/deadends/, Trent wants to FINALLY TEST ACTUAL INTERNET CO-OP WITH FRIENDS.

That should be a major next milestone.

Test:
- 2 real machines / different networks
- 4 players if possible
- join
- mid-run join
- disconnect
- bot takeover
- reconnect if supported
- chapter transition
- door states
- revives
- throwable sync
- safehouse close
- host leaving behavior
- bandwidth
- latency/jitter

Do not claim real internet multiplayer is verified until this happens.


============================================================
30. SAVE SYSTEM
============================================================

The game has campaign checkpoints.

V13 added portable save concepts:
- Export Save
- Import Save
- Restore backup
- schema validation
- current-tab fallback if local storage fails

Reason:
localStorage behavior under file:// is browser-dependent.

Once hosted on HTTPS at tront.xyz/deadends/, persistent origin storage should become much more predictable.

Still test:
- complete chapter
- close tab/browser
- return later
- Continue
- finish campaign
- old checkpoint compatibility
- corrupted import
- backup restore


============================================================
31. AUTOMATED QA HISTORY
============================================================

A lot of automated regression work has been performed across versions.

Tests have included:
- real Play Solo menu button
- all five map construction
- safe-room departure
- objective completion
- chapter transitions
- campaign progression
- defeat/retry
- revives
- healing
- weapons
- Molotovs
- pipe bombs
- camera anchoring
- deterministic Remix seeds
- reachable required items
- bridge traversal
- local multiplayer
- disconnect-to-AI
- save logic
- profiler export
- responsive layouts

However:
NEVER treat automated route completion as proof that the game is fun or balanced.

Trent's human playtest feedback is more important for that.


============================================================
32. BIG BUG / REGRESSION HISTORY WORTH REMEMBERING
============================================================

A few painful regressions happened before.

1. ART CACHE DISABLED PLAY SOLO
An optional blood/body cache prewarm disabled Play after the visible loading indicator had disappeared.

Result:
Main menu looked dead.
Play Solo disabled.
Live AI menu didn't start.

Rule:
OPTIONAL ART PREWARM MUST NEVER BLOCK PLAY.

2. BRIDGE WATER PAINTED OVER WALKABLE ROAD
A decorative water rectangle visually overlapped traversable route.

Rule:
Map art must be screenshot/regression checked against navigation geometry.

3. BRIDGE RAILING CROSSED ROUTE
Decorative geometry visually/physically interfered with expected path.

Rule:
Do not let decorative map art contradict traversability.

4. CAMERA CHASE JUDDER
Smoothed camera lagged behind 60 Hz simulation movement.

Rule:
Keep interpolated locked camera.

5. FIRE LOOKED LIKE EMOJI SPRITES
Repeated flame shapes were too cartoony.

Rule:
Irregular detailed fire field.

6. UI BECAME TEXT SOUP
The menu accumulated phrases like "ACTUAL GAMEPLAY," chapter metadata, descriptions, and decorative labels everywhere.

Rule:
REMOVE FILLER TEXT.
If text doesn't help make a decision, it probably shouldn't be permanently visible.


============================================================
33. MAP-SPECIFIC FLAVOR
============================================================

The maps intentionally feel different.

THE LAST BLOCK:
urban streets / shops / service gate / city traversal.

BURNOUT:
gas station environment, explosive/fuel opportunities.

LAST TRAIN:
subway / maintenance / train-space traversal.

CODE RED:
hospital grounds / alarm-related pressure.

DEADWEIGHT:
bridge/checkpoint traversal and winch sequence.

Do not flatten all five chapters into identical rectangular corridors with new labels.


============================================================
34. LIVE MENU PERFORMANCE
============================================================

The autonomous menu was once accidentally capped/behaving around ~30 FPS and felt worse.

It was revised to render more smoothly.

Keep the menu performance-conscious:
- it can run lower-complexity simulation if required,
- but interpolate so presentation stays smooth,
- pause/reduce background work when hidden/covered where appropriate.

The live menu is cool enough to justify a reasonable budget.


============================================================
35. WHAT TRENT LIKES ABOUT THE GAME
============================================================

Strongest recurring positives:
- huge hordes
- barely escaping
- smart AI squad
- visible carnage
- pipe bombs
- shotgun carnage
- destructible/reactive stuff
- movement through maps rather than camping
- the live menu match
- detailed top-down programmer art
- safe-room climax
- L4D-ish pacing without being a literal clone
- browser/Flash-game feeling
- a ridiculous amount happening in one HTML file

When deciding between:
"More systems"
and
"Make those things hit harder"

usually choose the second.


============================================================
36. WHAT TRENT DISLIKES
============================================================

Avoid:
- chores as multiplayer gameplay
- awkward cooperation for its own sake
- clever premise without satisfying core action
- AI-template websites/UI
- excessive permanent text
- giant design-system cards
- generic "modern SaaS" visuals
- limp weapons
- bullet sponge difficulty
- feature bloat
- pathfinding/nav that obviously stalls
- disappearing carnage purely for optimization
- ugly repeated effects
- a camera that floats behind the player
- speculative rewrites instead of measuring actual bottlenecks
- claiming something was tested when it wasn't


============================================================
37. DEPLOYMENT TASK — TRONT.XYZ/DEADENDS
============================================================

Your immediate infrastructure goal is to put v14 online at:

https://tront.xyz/deadends/

Recommended result:
tront.xyz/deadends/index.html

Before publicizing:
- preserve the original v14 locally,
- deploy a copy,
- verify HTTPS,
- verify no console boot errors,
- verify Play Solo,
- verify live menu,
- verify chapter selection,
- verify Continue after an actual browser reload,
- verify links point to tront.xyz correctly,
- verify no path assumes root `/`,
- verify PeerJS can load from deployed HTTPS page,
- test a real remote room code with Trent + friend.

Because the current game is one HTML file, deployment SHOULD stay boring.

Do not turn deployment into a bundler migration unless the hosting setup somehow requires it.


============================================================
38. MULTIPLAYER PUBLIC TEST LABEL
============================================================

Until actual separate-network testing succeeds, describe online co-op as something like:

"Experimental online co-op"

Do not advertise:
"Rock-solid four-player online multiplayer"

based only on BroadcastChannel tests.


============================================================
39. WHAT TO DO AFTER DEPLOYMENT
============================================================

Suggested order:

A. DEPLOY EXACT V14
Get a known-good hosted baseline online.

B. REAL FRIEND SESSION
Do not add 20 systems first.

Play multiple chapters online with actual friends.
Observe:
- join reliability
- latency
- who feels authoritative
- revives
- specials
- tactical doors
- safe-room finish
- weapon pickup sync
- chapter progression

C. FIX RELEASE BLOCKERS
Crashes, desyncs, impossible objectives, broken saves.

D. WATCH HUMAN PLAY
Especially:
- Does anyone use tactical doors?
- Do people intentionally detour for weapon finds?
- Does ending safehouse pressure create a better climax?
- Do players understand shove interrupts naturally?
- Do bots help without stealing the game?
- Does Remix actually feel different?

E. THEN ADD CONTENT
New maps/encounters only after human feedback indicates what the game is missing.


============================================================
40. DO NOT LOSE THE PROJECT'S SCALE
============================================================

This started as:
"Could we make a little multiplayer browser game to share with friends?"

The project got shockingly good.

Do not now turn it into a three-year live-service project by default.

A polished, free, immediately playable browser co-op zombie game on tront.xyz is already a win.

If a feature makes the game:
- harder to share,
- harder to load,
- less readable,
- less fun in the first 30 seconds,

it needs a damn good justification.


============================================================
41. V14 SPECIFIC QA STATUS
============================================================

The latest v14 build was tested for:

- Play Solo enabled and clickable
- Solo startup
- ending-safehouse damage while door is open
- final door closure triggering victory
- all five maps constructing
- v14 weapon finds existing across maps
- Heavy Rifle pickup
- Auto Shotgun pickup
- Mercer closed tactical doors
- connector tactical doors on later maps
- opening / closing connector door
- Brute shove interrupt
- normal smoke execution without JS errors

One longer final five-map automated walkthrough after the last connector-door placement exceeded the harness execution window.

Therefore:
DO NOT claim v14 has a fresh full five-map post-final-change route regression.

The connector doors were deliberately initialized OPEN on non-Mercer maps to minimize traversal regression risk.

A full human/automated campaign pass on the deployed v14 is a good next QA item.


============================================================
42. SOURCE OF TRUTH
============================================================

The only source file you are receiving should be:

dead_ends_v14.html

Use it.

Do NOT attempt to reconstruct the game based on these notes.
These notes explain WHY the strange systems in that source exist.

When you encounter ugly-looking accumulated code, remember:
this game went through many surgical iterations and performance regressions.

Refactor only when:
1. you understand the current behavior,
2. you can compare before/after,
3. you run the relevant regression tests.


============================================================
43. FINAL PRODUCT PHILOSOPHY
============================================================

DEAD ENDS should feel like:

Someone made a badass zombie Flash game in 2026,
then gave it modern AI, massive hordes, co-op networking,
a real AI Director, detailed procedural art,
and an absurd amount of technical sophistication
without losing the instant PLAY button.

Protect that.

— Handoff ends here —
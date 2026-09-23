# DEAD ENDS v24.1 - mouse-release hotfix

Base: the exact delivered `dead_ends_v24.html`. This is a targeted input repair, not a new gameplay/art branch. `BUILD.json` records the hashes and the successful reconstruction of the unchanged base after removing the three exact input edits and the scoped hotfix block.

## Reproduced cause

Native Chromium mouse input reproduces this on v24:

1. Fire with the left button.
2. Press the right button while still holding the left.
3. Release left before right.
4. Release right too. The game still thinks left is held and continues consuming ammunition.

Pointer Events report intermediate button changes through `pointermove`; `pointerup` arrives when the final button is released. The previous code only cleared the flag corresponding to `event.button` on `pointerup`, so it left the earlier-released button latched. It also ignored a secondary button pressed during an existing mouse chord.

In the matched regression, ammunition was 29 immediately after both buttons were physically released. Half a second later, v24 was at 24; v24.1 remained at 29. The events came from Playwright's native browser mouse API; the post-release half-second used thirty fixed simulation steps.

Specification reference: W3C Pointer Events, chorded button interactions and pointerup semantics: https://www.w3.org/TR/pointerevents/#chorded-button-interactions

## Repair

- Reconcile the complete `buttons` mask on pointer down/move/up, including intermediate releases.
- Admit an attack only on a genuine press originating from gameplay. Dragging a UI click back over the world or returning while still held does not create an attack.
- Read releases in window capture phase, including release over an input-consuming HUD control or outside the canvas. Mouseup is a clearing-only fallback.
- Handle pointer cancellation, capture loss, focus loss, hidden pages, menu/map entry and equipment-wheel entry.
- Clear canceled pending mouse attack edges without resetting the monotonic attack counter. Normal fast press/release pairs between ticks remain valid.
- Keep touch and controller input separate. A neutral mouse sample cannot clear a controller's final-throw latch.
- Retain the existing reliable equipment sequence for release-to-rearm information. No new packet field, discovery namespace or wire version.
- Overlay/style checks run only when considering a new press, not on high-rate hover events. No extra per-frame polling loop or timeout is added.

Sticky pipe bombs/Molotovs, one-throw-per-press, last-item firearm return, held-through-return protection, healing, and the fire axe are retained. Releasing the axe button prevents subsequent swings; an already committed swing is allowed to finish.

## QA

All 61 final checks pass:

- 35 input/native-control checks, including both chord orders and both release orders, left/middle combinations, weapon alternation, release over HUD/outside the viewport, missing capture, capture loss, queued cancellation, menus, touch separation, virtual gamepad and consumables. One check includes 60 seeded randomized chord/weapon/release rounds with ammo assertions after every release.
- 5 isolated two-browser checks with native mouse input, native game loops, and the real game JSON/base64/chunk protocol over a simulated Peer-compatible broker. Verified host-side shots stop after remote releases, weapon cycling, sticky stacks, and neutral input after client focus loss.
- 21 original v24 targeted axe/door/window/save/state integration checks, with only their expected build label changed.

The same native chord sequence was tested against untouched v24 and the final hotfix: old bug reproduced, repaired sequence passed. No page runtime errors were captured in the final suites.

The first input-fixture run had three harness mistakes: a restored native method was accidentally returned/invoked by the test driver, a capture was released before it had become active, and a medkit test assumed two starting medkits without setting that fixture. These were corrected and the entire suite rerun. Rejected first-run receipts are retained in the test pack and are not counted as passing QA.

Limits: no fresh full-campaign walkthrough; virtual controller is not physical hardware; simulated Peer transport is not internet WebRTC/NAT validation. Blur/visibility/cancel fault cases are explicitly injected. No real public rooms were accessed. No live website or repository was modified.

## Deployment / Claude

Deploy the release ZIP's `index.html`, which is byte-identical to `dead_ends_v24_1.html`. Keep supporting site files and og-image unchanged. Do not reapply old networking or art merge layers.

Wire protocol and public discovery remain v24-compatible. Update each player's browser/page for the mouse fix; upgrading only the host cannot repair an old client's local stuck-button flag. Run the repository's release gates before publishing. Public-room tests must use an isolated namespace or private test room, never an occupied production lobby.

Files: main HTML, `QA_RESULTS.json`, `BUILD.json`, and this README. Separate test pack includes reproducible build/patch scripts, both-build reproduction logs, regression harnesses and one actual-render smoke screenshot.

# DEAD ENDS v23 - Focus HUD / sticky throwable stacks

Canonical base: the complete `dead_ends_v22_1.html` hotfix. This is not a fork of an older gameplay/network version. The v22.1 lighting module and all previous controller, safehouse, save and networking integrations are retained.

## Changes

- Default local HUD sits below the rendered survivor. Health/stamina, a named selected weapon, its silhouette, magazine/reserve ammunition or the selected item's quantity are visible together. Its position comes from the same interpolated Canvas transform as the survivor; its size remains in CSS pixels independently of world resolution.
- The selected weapon name stays visible while reloading. Reload progress, low ammo, critical health, downed bleed-out and spectating have explicit states.
- Options -> Health & weapon position: Near survivor, Top center, Classic corners. Options -> Focus HUD size: Standard or Large. These preferences use a separate local-storage key, with the normal storage-unavailable fallback; campaign saves are unchanged.
- In focus modes the duplicate local corner health and large corner ammo readout are hidden. Teammates remain in the roster. The small clickable inventory rack remains on desktop; compact viewports use the existing keyboard/controller/touch gear controls.
- Contextual interaction prompts sit below the near-survivor HUD. The entire focus HUD is pointer-transparent, so it cannot intercept firing or aiming clicks.
- Pipe bombs and Molotovs remain selected while their stack has items left. Exhaustion returns to the last selected firearm, or a valid primary fallback. One click/trigger press produces one throw. Holding through the last throw does not start shooting the returned gun.
- Medkits retain their previous completed-use gun-return behavior.
- A neutral pointer release is carried through the existing monotonic equipment command, including releases between network ticks. Controller post-use latches no longer get cleared by an unrelated neutral mouse sample in the underlying keyboard controls.

## What was deliberately not changed

No lighting/art/map/AI/director rewrite. No shortened grenades, damage changes, deleted gore, altered camera spring, different network transport, new snapshot fields or protocol change. The only exact replacement in the base file is the post-consumable-use selection policy. The scoped V23 layer adds UI and control-latch integration. `BUILD.json` records the base/result hashes and source reconstruction check.

## Deployment / Claude

Use the release ZIP's `index.html` as the new single-file page at `/deadends/`. It is byte-identical to the standalone `dead_ends_v23.html`. Keep the repository's existing supporting files and og-image; this pass does not require new runtime assets. No build step is required to play.

Do NOT reapply old v15/v16/v18 co-op merge layers. They are already integrated into the canonical v22.1 base. Run the repository's release checks before uploading. Update old tests that require an automatic gun return after *every* throwable: the return is now deliberately only on the last throwable in the selected stack.

The wire schema still uses protocol19. To get the new throwable policy in online games, the authoritative host must run V23; use V23 on every machine for consistent behavior and UI. Public discovery remains unchanged. Test private or isolated rooms, never a production public room someone may be playing in.

No live website, repository, or Library file was modified by this work.

## QA evidence

- 31 targeted input/HUD/gear/resize/save/safehouse checks.
- 8 isolated two-page networking checks: actual game JSON/base64/chunk encoding over a simulated Peer-compatible transport, including remote controller stack retention, HUD counts, last-item return/release, client tracers after reload, doors, chapter transitions and disconnect-to-AI.
- 6 rendered-position/layout checks, including movement at deterministic 60/144-Hz callback cadences, aim-offset mode, and compact contextual-prompt layout. These timestamps are not a physical high-refresh display test.
- 4 native browser-flow checks, including the real Play Solo button, mouse throws, Options, and F8/F9 recording/export. The native rAF combat capture ran for 15 seconds.
- 10 complete Classic chapter walkthroughs: all five maps on V22.1 and on V23 in the same sequential fixture history. All five final paired gameplay-state traces match. These are invulnerable navigation/objective regressions, not balance certification.
- Actual browser-rendered comparisons with identical staged game state/camera/lighting. Only image scaling and outside-image captions were added. No screenshot retouching.

The repeated campaign run originally hit an execution-window cutoff. Resuming one chapter in a fresh page did not reproduce the preceding fixture history, so that mixed-history comparison was rejected; the entire paired sequence was rerun to completion and matched. The rejected test record is retained in the test pack, not counted as final verification.

Virtual controller input is not a physical-controller test. The two-page transport test is not native WebRTC/NAT verification. Real internet co-op and hosted-origin browser-restart storage persistence were not reverified here. Headless software-Canvas timings are not Windows/5070 Ti GPU timings, and this HUD pass makes no FPS-improvement claim.

## Artifacts

`QA_RESULTS.json` includes the complete final receipts; `BUILD.json` identifies the exact build. The comparison and live screenshots are taken from the actual browser. The separate test pack contains the patch, reproducible build script, harnesses, raw captures, and logs. Harness paths target the `/mnt/data` working environment; adapt those paths/Chromium executable or port the cases into the repository's existing test tools.

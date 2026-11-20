# Cinematic exploration upgrade

The world now uses a midnight-blue sky, warmer sunlight, blue mineral shadows and copper-lit installations. Earth sits above the basin, while a ringed world rewards looking south. Mountain lighting follows the sculpted geometry. A quieter, broader ridge treatment replaced the overly sharp first pass. The opening image at /experience comes from the playable renderer.

## Controls and navigation

WASD and arrows walk relative to the camera. Space or Jump launches a single low-gravity leap. Horizontal momentum carries through airtime, with reduced steering strength and a shared terrain-height landing calculation. A relaxed leg tuck blends with the supplied walk and idle animations. Footprints and footfall dust emit on the ground.

O or World overview pulls the camera into a bounded orbit. Drag, rotate buttons and left/right arrows change the view. Zoom buttons adjust the range. World-owned location buttons look toward landmarks. Movement pauses while the overview is active. Return to Exploration or Escape restores the saved walking orientation at the same position.

M or Map opens the native survey dialog. Contours come from the terrain function. The position triangle shows the astronaut's heading. Location buttons expose scenic descriptions or current portfolio assignments. View from above points the overview toward the selection. Selecting a location leaves the astronaut in place. Escape, M or Close map dismisses the dialog and restores focus. The map and overview retain keyboard and touch controls.

## Discoveries and environmental motion

The Celestial Orrery turns copper rings around a luminous core. The Signal Archive uses upright memory fins with warm inset strips. Both have proximity labels, collision, inspection panels and explicitly labeled world-demo descriptions. The ferry has a scenic panel as well. MEETFLIX retains its preparation status at the relay.

Project assignments continue to live in the typed catalog. World definitions own physical locations and scenic content. A catalog assignment takes precedence over the demo at the same location. Removing an assignment restores the scenic panel. The direct work index contains verified project records.

A distant courier makes an 18-second crossing after the first 18 seconds of active scene time, then leaves the sky quiet for almost three minutes. The Orrery and the existing slow celestial motion use the demand-rendered scene. Reduced motion suppresses the courier and rotating instrument. Overview transitions shorten when reduced motion is active.

## Actual browser evidence

The following screenshots are Chrome captures of the implemented world at ordinary walking height. The before images show production checkpoint 76b5cde. The matching four compass views start at the same spawn and use the same drag rotation on both builds.

| Direction | Desktop before | Desktop after | Portrait before | Portrait after |
| --- | --- | --- | --- | --- |
| Forward | [Before](screenshots/cinematic-upgrade/before-desktop-0.jpg) | [After](screenshots/cinematic-upgrade/after-desktop-0.jpg) | [Before](screenshots/cinematic-upgrade/before-portrait-0.jpg) | [After](screenshots/cinematic-upgrade/after-portrait-0.jpg) |
| Quarter turn | [Before](screenshots/cinematic-upgrade/before-desktop-1.jpg) | [After](screenshots/cinematic-upgrade/after-desktop-1.jpg) | [Before](screenshots/cinematic-upgrade/before-portrait-1.jpg) | [After](screenshots/cinematic-upgrade/after-portrait-1.jpg) |
| Reverse | [Before](screenshots/cinematic-upgrade/before-desktop-2.jpg) | [After](screenshots/cinematic-upgrade/after-desktop-2.jpg) | [Before](screenshots/cinematic-upgrade/before-portrait-2.jpg) | [After](screenshots/cinematic-upgrade/after-portrait-2.jpg) |
| Eastern rim | [Before](screenshots/cinematic-upgrade/before-desktop-3.jpg) | [After](screenshots/cinematic-upgrade/after-desktop-3.jpg) | [Before](screenshots/cinematic-upgrade/before-portrait-3.jpg) | [After](screenshots/cinematic-upgrade/after-portrait-3.jpg) |

| Feature | Desktop | Portrait |
| --- | --- | --- |
| Survey map | [Map](screenshots/cinematic-upgrade/desktop-map.jpg) | [Map](screenshots/cinematic-upgrade/portrait-map.jpg) |
| Orbital overview | [Overview](screenshots/cinematic-upgrade/desktop-overview.jpg) | [Overview](screenshots/cinematic-upgrade/portrait-overview.jpg) |
| Orrery approach | [Orrery](screenshots/cinematic-upgrade/desktop-orrery.jpg) | [Orrery](screenshots/cinematic-upgrade/portrait-orrery.jpg) |
| Archive approach | [Archive](screenshots/cinematic-upgrade/desktop-archive.jpg) | [Archive](screenshots/cinematic-upgrade/portrait-archive.jpg) |
| Ferry | [Ferry](screenshots/cinematic-upgrade/desktop-ferry.jpg) | [Ferry](screenshots/cinematic-upgrade/portrait-ferry.jpg) |
| Jump | [Jump](screenshots/cinematic-upgrade/desktop-jump.jpg) | [Jump](screenshots/cinematic-upgrade/portrait-jump.jpg) |

[Ringed world](screenshots/cinematic-upgrade/ringed-world.jpg) · [Distant courier crossing](screenshots/cinematic-upgrade/courier-crossing.jpg)

## Verification

ESLint, strict TypeScript and the production build passed. The expanded Playwright suite has 41 passing tests. It covers the existing route matrix, keyboard and touch movement, direct project URLs, browser history, fallback, adaptive quality, jumping and landing, single-use jump input, overview return, map pause and focus, scenic fallbacks, assignment precedence, reduced motion and Lite quality.

The additional browser route uses actual keyboard or emulated touch input to reach the relay, Orrery, Archive and ferry, opening each panel. The map and overview captures use the same ordinary controls. A separate production copy changes only the catalog to associate MEETFLIX with the Orrery, then verifies that inspection opens the existing MEETFLIX project URL.

## Rendering comparison

Three fresh Chrome sessions per device and build ran sequentially on an Apple M4. The baseline is an isolated production build of 76b5cde using Webpack. The upgrade uses the normal Turbopack production build. Both samples use Auto quality, the same spawn, three seconds of forward input and the same instrumented renderer. Desktop renders at 1440 × 830. Portrait emulates 390 × 844 at DPR 2, rendering at 468 × 936. Values are medians of the three runs.

| Metric | Desktop before → after | Portrait before → after |
| --- | ---: | ---: |
| Active frame rate | 60.0 → 60.0 | 60.0 → 60.0 |
| 95th-percentile frame interval | 16.7 → 16.7 ms | 16.7 → 16.8 ms |
| Median renderer CPU submission | 2.00 → 2.30 ms | 1.90 → 2.10 ms |
| Median GPU render time | 6.62 → 7.11 ms | 3.67 → 3.95 ms |
| Draw calls per frame, including shadows | 68.1 → 82.2 | 68.2 → 75.2 |
| Submitted triangles per frame, including shadows | 401,187 → 408,070 | 401,195 → 404,577 |
| Exploration transfer | 2,717,344 → 2,718,158 bytes | 2,600,838 → 2,631,792 bytes |
| Sampled JavaScript heap | 24,323,902 → 25,476,338 bytes | 27,063,396 → 24,263,064 bytes |
| Resident texture count | 20 → 20 | 20 → 20 |
| Resident geometry count | 43 → 53 | 43 → 50 |

GPU durations use EXT_disjoint_timer_query_webgl2 around renderer.render, rejecting disjoint samples. CPU submission includes the instrumentation overhead. JavaScript heap samples depend on garbage collection and exclude GPU allocations. Texture and geometry counts describe resources tracked by Three.js. The frame-rate result is bounded by the 60 Hz display. Both homepages made zero exploration-asset requests. Physical-phone GPU performance remains unmeasured.

## Sources and limitations

[Creative direction and reference research](creative-direction.md) records the visual studies and skill guidance. The [asset ledger](asset-credits.md) documents existing CC0, CC BY and NASA assets and the newly authored geometry and shader work. All runtime artwork stays local. The project dependency list is unchanged.

The improved silhouettes and blue-hour lighting still expose angular terrain and simple structure geometry at some viewpoints. The ferry retains its blockout hull. Mobile verification uses Chrome touch emulation on a desktop GPU. Physical iOS Safari and Android performance and thermals need device testing. The map contours use a coarse survey of the shared height field, and the overview offers a controlled orbit. The current release extends surface exploration. Future travel environments remain in the roadmap.

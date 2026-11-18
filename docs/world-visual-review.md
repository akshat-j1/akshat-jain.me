# Lunar world · local visual review

**Decision: hold locally.** The Earth-facing composition and the sense of scale at the relay improved. At the eastern heading, a broad plain and repeated rock shapes dominate. In the southeast, adjacent peaks still read as rounded lobes with too little structural separation. These fail the all-direction art target. Git checkpoint for the comparison: `e214661`.

## Audit and acceptance criteria

At spawn and the relay, the foreground boulders looked cut from a single primitive and the sky had little spatial structure. Looking back across the site removed Earth, leaving few recognizable features. On the western slope, the old rim formed a continuous wall. Inside the basin, idealized crater shoulders repeated at similar scales. The portrait crop put Earth close to the heading.

The criteria set before implementation were distinct near, intermediate, and distant layers from multiple positions, readable terrain in backlight, and an intentional celestial composition through an orbit. The eight-heading comparison below is part of the release decision. Motion and frame timing were evaluated separately.

## Rendered changes

- Replaced the local analytic impact profiles with an optional height atlas compiled from twelve measured SLDEM crater cutouts. The ground mesh, walker, foot placement and camera sample the same relief. The original sampler remains available during asset failure. Walking deposits a bounded trail of boot impressions.
- Composed a second range from separate Copernicus central-uplift profiles. Residual inner-wall relief introduces gullies below the main silhouette. A scanned rock face is rasterized into the heightfield before horizon illumination is computed. A projected rock-face material exposes mineral variation on slopes.
- Placed two decimated CC0 rock scans in instanced groups from the route into the middle distance. The collider boulders use the same centers as before. Clusters beyond the route break up the transition from loose regolith to the inner wall.
- Added a locally packed Milky Way survey and 7,200 separately rendered Hipparcos/Tycho star-map peaks. Both use the same galactic orientation. The camera can rotate freely beneath them. The solar disc uses the light direction used by the terrain. Earth retains its rotating, separately lit 3D surface and clouds. Its apparent diameter and sky exposure are artistic choices.

The first pass produced inflated peaks, a distracting galactic core and rows of boulders. Later passes widened the peaks, changed the boulder distribution, reduced sky exposure and separated individual stars. A runtime cliff-scan pass left conspicuous dark patches. Those meshes were removed in favor of relief baked into the ground. The final trail pass reduced the height of the broad terrain underneath the smaller impacts.

## Matched frames

Real local Chrome production renders at DPR 1, Balanced quality and 48° vertical FOV. Camera and walker coordinates match within each pair, including where the changed ground height alters framing. The fixed west-slope camera is close to the foreground and crops the walker. Free-follow clearance was tested separately.

| View | Git checkpoint | Local review |
| --- | --- | --- |
| Spawn | ![before, Spawn](screenshots/world-review/before-desktop-spawn.jpg) | ![review, Spawn](screenshots/world-review/review-desktop-spawn.jpg) |
| Observe | ![before, Observe](screenshots/world-review/before-observe.jpg) | ![review, Observe](screenshots/world-review/review-observe.jpg) |
| Main basin | ![before, Main basin](screenshots/world-review/before-basin.jpg) | ![review, Main basin](screenshots/world-review/review-basin.jpg) |
| West slope | ![before, West slope](screenshots/world-review/before-west-slope.jpg) | ![review, West slope](screenshots/world-review/review-west-slope.jpg) |
| Reverse view | ![before, Reverse view](screenshots/world-review/before-reverse.jpg) | ![review, Reverse view](screenshots/world-review/review-reverse.jpg) |
| Relay approach | ![before, Relay approach](screenshots/world-review/before-desktop-relay.jpg) | ![review, Relay approach](screenshots/world-review/review-desktop-relay.jpg) |
| Mountain approach | ![before, Mountain approach](screenshots/world-review/before-desktop-ridge.jpg) | ![review, Mountain approach](screenshots/world-review/review-desktop-ridge.jpg) |
| Earth-facing | ![before, Earth-facing](screenshots/world-review/before-desktop-earth.jpg) | ![review, Earth-facing](screenshots/world-review/review-desktop-earth.jpg) |
| Portrait spawn | ![before, Portrait spawn](screenshots/world-review/before-portrait-spawn.jpg) | ![review, Portrait spawn](screenshots/world-review/review-portrait-spawn.jpg) |
| Portrait exploration | ![before, Portrait exploration](screenshots/world-review/before-portrait-walk.jpg) | ![review, Portrait exploration](screenshots/world-review/review-portrait-walk.jpg) |

| View | Viewport | Walker XZ | Eye XYZ | Look-at XYZ |
| --- | --- | --- | --- | --- |
| Spawn | 1440 × 900 | [0, 2.5] | [2.4, 3.06, 10.3] | [0.35, 1.66, -1.4] |
| Observe | 1440 × 900 | [0, 2.5] | [3.35, 4.39, 13.5] | [0.35, 2.53, -2.25] |
| Main basin | 1440 × 900 | [8, -16] | [12, 4.52, -10] | [0, 0.85, -28] |
| West slope | 1440 × 900 | [-12, -21] | [-6.3, 4.56, -23] | [-36, 3.1, -14] |
| Reverse view | 1440 × 900 | [-5, 6] | [-6, 3.27, -0.8] | [-2, 2.8, 27] |
| Relay approach | 1440 × 900 | [-0.45, -6.6] | [2.8, 3.24, 1.9] | [0.35, 1.45, -12.5] |
| Mountain approach | 1440 × 900 | [0, 2.5] | [5.72, 3.35, 9.8] | [-22.5, 5.5, -29.5] |
| Earth-facing | 1440 × 900 | [0, 2.5] | [3.35, 3.9, 12.3] | [0.38, 4.78, -13.3] |
| Portrait spawn | 390 × 844 | [0, 2.5] | [0.3, 2.86, 9.15] | [0.13, 1.26, -0.85] |
| Portrait exploration | 390 × 844 | [-0.35, -4.85] | [1.92, 3.02, 1.45] | [-1.5, 1.65, -10.9] |

## Full orbit

Both builds were rendered at 45° intervals around spawn, at 1280 × 800, with fixed camera radius, target height, viewport and Balanced quality. Each sheet contains the eight original browser captures, resized and labeled. North points toward negative Z.

![Checkpoint in all eight directions](screenshots/world-review/before-orbit.jpg)

![Local review in all eight directions](screenshots/world-review/review-orbit.jpg)

In a separate instrumented render of these headings, the maximum fraction of visible-terrain-footprint pixels at or below 12/255 display luma was 0.047% in the local build. This count uses a terrain-only coverage mask over the full rendered color frame and can include the astronaut or rocks in front of terrain. It measures near-black coverage, not artistic quality.

## Matched performance

Apple M4, Chrome/ANGLE Metal, production builds, automatic quality. Three fresh sessions per viewport, 2.4 seconds of held forward movement each. Medians across runs. Desktop 1440 × 900 at DPR 1. Portrait 390 × 844 at requested DPR 2, emulated on the same GPU.

| Build | View | FPS | P95 interval | Draws/frame | Triangles/frame | Lunar asset transfer | Tracked texture allocation | Local asset ready |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| before | desktop | 60.0 | 16.7 ms | 60.26 | 297,952 | 1,955,092 B | 37,399,196 B | 451 ms |
| before | portrait | 60.0 | 16.7 ms | 60.27 | 297,962 | 1,955,092 B | 37,399,196 B | 445 ms |
| review | desktop | 60.0 | 16.8 ms | 64.14 | 393,508 | 2,415,114 B | 50,681,148 B | 452 ms |
| review | portrait | 60.0 | 16.7 ms | 64.17 | 393,528 | 2,415,114 B | 50,681,148 B | 452 ms |

All measured landing sessions requested zero exploration assets. Texture allocations count recognized WebGL storage formats and exclude other process memory. A separate WebGL timer-query run recorded 144 desktop frames per build. Checkpoint GPU median/P95 was 8.50/8.69 ms and local was 6.30/6.46 ms. This is a single short run with variable GPU clocks. Earlier trial timings varied, so it does not establish a GPU speedup. Physical mobile performance was not measured.

## Functional verification

ESLint, strict TypeScript and the Next.js production build passed. All 27 Playwright tests passed in 54.2 seconds. The suite covers camera-relative walking, touch cancellation, focus return, relay interaction, adaptive quality, reduced motion, WebGL loss, asset failures and direct HTML portfolio access.

Additional checks ran against the local production build in Chrome. Walking forward and diagonally, orbiting while walking, releasing movement controls, switching Observe mode, inspecting the dish, dismissing the project panel and using the navigation all worked. The northwest boundary orbit had a minimum measured camera clearance of 0.85 scene units above the ground. Collision checks stopped the walker 1.65 units from the tested rock center and 2.37 units from the relay center. A 1.6-second walk produced six boot impressions, and their count held steady once the astronaut stopped.

## Sources

The [asset ledger](asset-credits.md) documents the terrain survey, NASA catalog visualizations, CC0 scanned rocks and material derivatives. No runtime dependencies were added. The formations are composed and rescaled from survey windows. The sky orientation and long-exposure appearance are art-directed.

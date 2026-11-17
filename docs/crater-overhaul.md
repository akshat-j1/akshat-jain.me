# Copernicus environment review

The baseline is commit `110665b`. The distant terrain previously depended on a 256-pixel authored atlas, sparse radial mesh rings and interpolated vertex shadows. A fine ejecta map repeated along the far slopes. In backlight, strong shadow attenuation left little shape information. Close camera pitch could crop the astronaut, and a low Earth could intersect mountains or controls.

## Rendering changes

The outer terrain now follows one continuous section of the Copernicus crater floor, inner terraces and rim. Its mesh samples a 320 × 320 height map. A separate 1024 × 1024 map resolves measured surface normals and illumination between vertices. A 62-step horizon search bakes solar visibility, and eight surrounding horizons estimate occlusion. A directional fill approximates light reflected from the opposite wall. This lighting is baked for the fixed scene sun. The near ground, astronaut and relay continue using real-time lights.

The trail blends into the survey between radii 36 and 55. Large boulders use additional oblique fracture planes. A slightly longer camera arm and reduced pitch leverage give the suit more room. The scene places Earth higher in a gap along the rim and makes faint stars more visible. The site uses local assets from the [credited SLDEM2015 product](asset-credits.md). No runtime dependency was added.

## Matched frames

Each pair uses identical world-space eye and target, walker position, viewport, quality, 48° FOV and DPR 1. The Observe pair was taken with Observe enabled. The two uploaded crops contain no camera coordinates, so the sun-facing and backlit shots recreate those viewing conditions. The exact pose matches apply within each new pair.

| View | Phase 2.2 | Copernicus pass |
| --- | --- | --- |
| Desktop spawn | ![before Desktop spawn](screenshots/crater-overhaul/before-desktop-spawn.jpg) | ![release Desktop spawn](screenshots/crater-overhaul/release-desktop-spawn.jpg) |
| Sun-facing scarp | ![before Sun-facing scarp](screenshots/crater-overhaul/before-lit-wall.jpg) | ![release Sun-facing scarp](screenshots/crater-overhaul/release-lit-wall.jpg) |
| Backlit scarp | ![before Backlit scarp](screenshots/crater-overhaul/before-shadow-wall.jpg) | ![release Backlit scarp](screenshots/crater-overhaul/release-shadow-wall.jpg) |
| Observe | ![before Observe](screenshots/crater-overhaul/before-observe.jpg) | ![release Observe](screenshots/crater-overhaul/release-observe.jpg) |
| Backlit scarp · Lite | ![before Backlit scarp · Lite](screenshots/crater-overhaul/before-lite-backlight.jpg) | ![release Backlit scarp · Lite](screenshots/crater-overhaul/release-lite-backlight.jpg) |
| Sun-facing scarp · High | ![before Sun-facing scarp · High](screenshots/crater-overhaul/before-high-lit.jpg) | ![release Sun-facing scarp · High](screenshots/crater-overhaul/release-high-lit.jpg) |
| Earth-facing | ![before Earth-facing](screenshots/crater-overhaul/before-desktop-earth.jpg) | ![release Earth-facing](screenshots/crater-overhaul/release-desktop-earth.jpg) |
| Portrait spawn | ![before Portrait spawn](screenshots/crater-overhaul/before-portrait-spawn.jpg) | ![release Portrait spawn](screenshots/crater-overhaul/release-portrait-spawn.jpg) |

| View | Viewport | Walker XZ | Camera XYZ | Target XYZ |
| --- | --- | --- | --- | --- |
| Desktop spawn | 1440 × 900 | [0, 2.5] | [2.4, 3.06, 10.3] | [0.35, 1.66, -1.4] |
| Sun-facing scarp | 1000 × 800 | [0, 2.5] | [-3.2, 2.38, 6.1] | [49, 8.3, -49] |
| Backlit scarp | 1000 × 800 | [0, 2.5] | [6.7, 2.95, -2.5] | [-47, 3.9, 39] |
| Observe | 1440 × 900 | [0, 2.5] | [3.35, 4.39, 13.5] | [0.35, 2.53, -2.25] |
| Backlit scarp · Lite | 1000 × 800 | [0, 2.5] | [6.7, 2.95, -2.5] | [-47, 3.9, 39] |
| Sun-facing scarp · High | 1000 × 800 | [0, 2.5] | [-3.2, 2.38, 6.1] | [49, 8.3, -49] |
| Earth-facing | 1440 × 900 | [0, 2.5] | [3.35, 3.9, 12.3] | [0.38, 4.78, -13.3] |
| Portrait spawn | 390 × 844 | [0, 2.5] | [0.3, 2.86, 9.15] | [0.13, 1.26, -0.85] |

All pairs use Balanced except the explicitly labeled Lite and High rows. The first survey placement put the rim across Earth. A second framing pass moved the site onto the northwestern crater floor and adjusted Earth’s direction. In backlight, the final pass also resolves smaller shadowed channels through baked directional fill. Some low foreground crater shoulders still appear smooth. Free orbit can occlude Earth, and the relief is vertically exaggerated.

## Production measurements

Three fresh local Chrome sessions per build and viewport on Apple M4/Metal. Each Auto-quality sample held forward for 2.4 seconds. The table reports the median of the three per-run statistics. The portrait drawing buffer is 468 × 936 on an emulated 390 × 844 screen. Desktop is 1440 × 900. GPU timing and total process memory were not instrumented. Texture bytes count recognized WebGL storage allocations, including mip levels.

| Build | Viewport | FPS | P95 interval | Draws/frame | Triangles/frame | Lunar asset transfer | Tracked texture bytes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| before | desktop | 60.0 | 16.7 ms | 60.26 | 280,939 | 1,609,376 B | 31,806,792 B |
| before | portrait | 60.0 | 16.7 ms | 60.26 | 280,939 | 1,609,376 B | 31,806,792 B |
| release | desktop | 60.0 | 16.7 ms | 60.26 | 297,942 | 1,955,092 B | 37,399,196 B |
| release | portrait | 60.0 | 16.8 ms | 60.27 | 297,972 | 1,955,092 B | 37,399,196 B |

The added survey detail costs one sampled GPU texture and additional radial mesh rings. The opening page requested zero exploration assets. Phone measurements use desktop GPU emulation. Physical iOS and Android performance is unmeasured.

## Verification

ESLint, strict TypeScript, and the production build passed. All 24 Playwright cases passed against the production server, including failure of either terrain atlas, reduced motion, context loss, direct HTML portfolio access, rotated movement, and touch cancellation.

A separate headed Chrome pass exercised diagonal and held movement, orbit during movement, Observe, clicking the relay, inspecting with E, closing with Escape, switching quality, and entering the portfolio. Boulder and relay contact measured 1.655 and 2.370 scene units respectively from their collider centers. In a 12-position Observe orbit at the northwestern walking limit, the smallest sampled vertical eye clearance above the actual rendered mesh was 0.877 scene units. The outer crater walls sit beyond the walkable trail.

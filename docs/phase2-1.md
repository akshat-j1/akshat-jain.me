# Phase 2.1 · Lunar environment

The local `feat/lunar-field-log` branch still has `efc0031` at HEAD, with the Phase 1, 2 and 2.1 work in the working tree. At the start of this pass, both the local `main` and the cached `origin/main` ref also pointed to `efc0031`. The Git remote is `https://github.com/akshat-j1/akshat-jain.me.git`. These are local Git observations.

## Visual audit and changes

| Phase 2 finding | Phase 2.1 implementation |
| --- | --- |
| Gaussian profiles created repeated rounded ridges. The near and far terrain were overlapping planes. | A 169 × 169 NASA LOLA crop supplies the rim, walls and regional relief around Copernicus. One continuous mesh increases vertex density near the walker and spaces vertices farther apart outside that area. Irregular ribs break up high scarps below the elevation data's resolution. |
| Uniform UV scale and low-frequency tonal bands made the local ground read as a flat gray surface. | Nearby impact bowls use asymmetric rims, broader ejecta aprons and sampled terrain heights shared with movement and camera clearance. Pebbles and larger blocks use separate instanced batches and cluster around craters. The original albedo and normals are layered at two differently oriented scales in Balanced and High. Surface reflectance and roughness vary with grain and aggregate. Lite uses one texture scale. |
| High solar angle, diffuse fill and short shadows compressed the sense of relief. | A directional sun about 18° above the horizon gives the suit, relay and large rocks longer shadows. A static terrain visibility approximation shades crater walls and distant folds beyond the local shadow map. The renderer uses ACES tone mapping at its default exposure. |
| Earth was oversized in angle, its unlit clouds crossed into the night side, and nearby star geometry shifted during traversal. | Earth spans about 1.9°. Its surface, clouds and limb share the scene's sun vector, and the dark side receives very little light. The sky follows camera translation so walking does not shift celestial bearings. Globe rotation and the separate cloud UV drift are slow. Faint synthetic stars represent a modest artistic exposure choice. |
| Footfall rendering could retain its last particle matrices after grains expired. | The instanced batch is hidden when inactive. The brief ground-triggered particles still follow lunar gravity. |

The Copernicus crop is compressed horizontally into the scene, uses vertically exaggerated relief and is blended into authored local ground. Earth is composed low above this fictional near-side site. This is a playable reconstruction using measured lunar forms. It does not identify an actual Apollo landing site or reproduce a dated sky. The local crater shapes, rock positions, rim detail and regolith remain artistically modeled. At some angles, distant terrain still looks smoother than Apollo photography. The site uses no lunar fog or atmospheric haze.

Visual and data references

- [NASA lunar surface views](https://science.nasa.gov/moon/image-galleries/views-from-the-lunar-surface/) and [Apollo 17 gallery](https://www.nasa.gov/gallery/apollo-17/) guided the contrast, disturbed ground and rubble distribution. No photographs from the galleries ship.
- [NASA's account of lighting on the Moon](https://www.nasa.gov/centers-and-facilities/ames/the-dark-side-of-the-crater-how-light-looks-different-on-the-moon-and-what-nasa-is-doing-about-it/) guided hard shadows and restrained fill.
- [CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/) documents the existing LOLA data source. The new derived crop adds 42,637 file bytes. Its exact provenance and the reused Poly Haven and Solar System Scope texture credits are in the [asset ledger](asset-credits.md). There are no additional npm dependencies.

## Browser captures

Each pair was captured from the actual production `/explore` route in headless Chrome. Desktop was 1440 × 900 and portrait touch emulation was 390 × 844. The capture sequence used spawn, forward movement until the relay was within reach followed by the same drag, and a fresh spawn with Observe plus an upward-screen drag. The relay position is repeatable to within a few movement frames because the key is released after the proximity event.

| View | Phase 2 | Phase 2.1 |
| --- | --- | --- |
| Desktop spawn | [Before](screenshots/phase2-1/before-desktop-spawn.jpg) | [After](screenshots/phase2-1/after-desktop-spawn.jpg) |
| Desktop relay and crater ground | [Before](screenshots/phase2-1/before-desktop-relay-ground.jpg) | [After](screenshots/phase2-1/after-desktop-relay-ground.jpg) |
| Desktop sky and horizon | [Before](screenshots/phase2-1/before-desktop-sky.jpg) | [After](screenshots/phase2-1/after-desktop-sky.jpg) |
| Portrait spawn | [Before](screenshots/phase2-1/before-portrait-spawn.jpg) | [After](screenshots/phase2-1/after-portrait-spawn.jpg) |
| Portrait relay and crater ground | [Before](screenshots/phase2-1/before-portrait-relay-ground.jpg) | [After](screenshots/phase2-1/after-portrait-relay-ground.jpg) |
| Portrait sky and horizon | [Before](screenshots/phase2-1/before-portrait-sky.jpg) | [After](screenshots/phase2-1/after-portrait-sky.jpg) |

## Paired performance measurement

Three cold Chrome contexts per viewport and version on the same Apple M4, with ANGLE Metal, Auto (Balanced), and both production builds served on loopback. Each context loaded the landing once and held forward for 2.4 seconds in Explore. Portrait specified touch and device DPR 2, capped by scene quality. The desktop drawing buffer was 1440 × 830 and portrait was 468 × 936 in both versions.

| Metric | Phase 2 desktop | Phase 2.1 desktop | Phase 2 portrait | Phase 2.1 portrait |
| --- | ---: | ---: | ---: | ---: |
| Landing transfer | 449,290 B | 449,296 B | 332,784 B | 332,790 B |
| Explore assets on landing | 0 | 0 | 0 | 0 |
| Explore asset transfer | 1,357,366 B | 1,400,303 B | 1,357,366 B | 1,400,303 B |
| First scene asset request to ready UI | 404–407 ms | 401–408 ms | 401–403 ms | 401–403 ms |
| Animation callbacks per second | 30.0 | 30.0 | 30.0 | 30.0 |
| p95 callback interval | 33.4 ms | 33.4 ms | 33.4 ms | 33.4 ms |
| Draw submissions per frame | 58.8 | 57.6 | 58.8 | 57.6 |
| Submitted triangles per frame | ~318,423 | ~286,076 | ~318,423 | ~286,096 |
| Known texture storage created | 31,020,364 B | 31,020,364 B | 31,020,364 B | 31,020,364 B |

Draw and triangle counts include shadow passes and instance counts. The texture measure sums known-format WebGL `texStorage2D` allocations including mip levels. It does not report actual GPU residency or renderbuffer memory. Two allocations used unclassified formats in each run. The added PNG is CPU elevation data. Explore transfer increased 42,937 bytes including response overhead. Submitted triangles decreased about 10%.

The two builds both ran at 30 FPS in the first paired runs. A separate six-sample run of the final production build, after moving the animated cloud uniform update to the mounted material, measured 60 FPS and a p95 of 16.7–16.8 ms at both viewport sizes. It submitted about 57.3 draw calls and 284,170 triangles per frame. Scene readiness was 457–461 ms and asset transfer remained 1,400,303 B. The difference in browser callback cadence between runs has no established cause, so it is not evidence of a frame rate gain over Phase 2. These measurements use the Apple M4 GPU for both viewports. Physical iOS and Android performance remain unmeasured.

## Local preview and verification

ESLint, strict TypeScript, the production build and all 16 Playwright tests passed. The production suite covered the eight viewport sizes, walking and touch cancellation, camera drag, relay proximity and dialog focus, adaptive quality, and the direct portfolio fallbacks. A separate visual browser run clicked the reflector geometry at the relay, confirmed the MEETFLIX panel opened and closed it with Escape.

```sh
npm run lint
npm run typecheck
npm run build
npm run start -- --hostname 127.0.0.1 --port 3113
```

Open [Explore](http://127.0.0.1:3113/explore). With the server running, use a second terminal for the full suite.

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3113 \
  PLAYWRIGHT_CHROMIUM_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  npm test
```

See [testing](testing.md) for browser coverage and physical-device instructions. The MEETFLIX case study remains in preparation pending verified content.

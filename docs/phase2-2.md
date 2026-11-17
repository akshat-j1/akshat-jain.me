# Phase 2.2 · First cinematic review

See [the cinematic refinement](phase2-2-cinematic.md) for the later visual pass and its comparison against this build.

The working tree contains the first pass for visual review. The local Phase 2.1 checkpoint is `32b31d8` on `feat/lunar-field-log`.

The walk opens beside a split, partly buried boulder. A breached crater and its ejecta lead toward the relay, with the measured Copernicus relief behind it. Ground texture transitions from compact dust to coarse fragments and exposed slopes. The extra roughness and normal detail taper with distance. Rock batches distinguish chips, cobbles, blocks, and slabs, with shadow casting limited to the larger shapes.

The existing directional sun lights both the landscape and Earth. Terrain visibility attenuates direct sunlight, and contact shading anchors the largest rocks. The relay feet sample the same terrain as the walker. The camera starts lower, checks obstacles from all orbit directions, and can pitch higher in Observe. Earth retains its approximate 1.9° angular diameter, with adjusted cloud contrast, glancing ocean reflection, and a narrow blue limb. The first pass retains the procedural star positions and varies their visibility as the camera looks up into the dark sky. Catalog alignment remains open for a later pass.

The photographs used for reference were [Apollo 15's fresh crater](https://science.nasa.gov/resource/view-of-portion-of-relatively-fresh-crater-as-photographed-by-apollo-15/), [Apollo 17's Split Rock](https://eol.jsc.nasa.gov/SearchPhotos/photo.pl?frame=21496&mission=AS17&roll=140), [Apollo 17 at Shorty Crater](https://science.nasa.gov/image-article/apod-2015-august-2-apollo-17-at-shorty-crater/), and [A Flag Points Home](https://science.nasa.gov/resource/a-flag-points-home/). These guided rock size and fracture, the falloff of rubble beyond the rim, foreground scale, and Earth's appearance. The NASA photographs are references. No photograph pixels enter the shipped textures.

The new `ejecta-detail.webp` is an original lossless 384 × 384 tile (111,238 bytes). It contains periodic fragment normals in red and green and fragment coverage in blue. The fragment relief uses 830 seeded, irregular convex shapes on a wraparound grid. The base Poly Haven dust and normal maps (CC0), NASA LOLA relief, and Solar System Scope Earth textures (CC BY 4.0) are reused. See [asset credits](asset-credits.md). No dependencies were added.

## Production browser captures

Each pair uses the same viewport and input sequence on both versions. The frame composition changes because Phase 2.2 changes the camera. Desktop is 1440 × 900. Portrait is touch emulation at 390 × 844.

| View | Phase 2.1 | Phase 2.2 first pass |
| --- | --- | --- |
| Desktop approach | [Before](screenshots/phase2-2/before-desktop-spawn.jpg) | [After](screenshots/phase2-2/after-desktop-spawn.jpg) |
| Desktop relay and crater | [Before](screenshots/phase2-2/before-desktop-relay-ground.jpg) | [After](screenshots/phase2-2/after-desktop-relay-ground.jpg) |
| Desktop Observe and Earth | [Before](screenshots/phase2-2/before-desktop-sky.jpg) | [After](screenshots/phase2-2/after-desktop-sky.jpg) |
| Portrait approach | [Before](screenshots/phase2-2/before-portrait-spawn.jpg) | [After](screenshots/phase2-2/after-portrait-spawn.jpg) |
| Portrait relay and crater | [Before](screenshots/phase2-2/before-portrait-relay-ground.jpg) | [After](screenshots/phase2-2/after-portrait-relay-ground.jpg) |
| Portrait Observe and Earth | [Before](screenshots/phase2-2/before-portrait-sky.jpg) | [After](screenshots/phase2-2/after-portrait-sky.jpg) |

## Performance and verification

Both versions ran from production builds on loopback. An Apple M4 ran headless Chrome with ANGLE Metal. Each set contains three cold contexts per viewport and samples 2.4 seconds of held forward movement at auto Balanced quality. Portrait used touch emulation and the same GPU.

| Metric | Phase 2.1 | Phase 2.2 first pass | Target |
| --- | ---: | ---: | ---: |
| Exploration asset transfer | 1,400,303 B | 1,511,841 B | Add at most 200 KB |
| Exploration asset requests on landing | 0 | 0 | 0 |
| Draw submissions per frame, including shadows | 57.2–57.3 | 60.3 | About 64 |
| Submitted triangles per frame | 284,153–284,173 | 284,506–284,536 | About 300,000 |
| Known texture storage allocations | 31,020,364 B | 31,806,792 B | |
| Scene request to ready UI, desktop and portrait combined | 449–458 ms | 447–456 ms | |
| Active browser cadence | ≈60 FPS | ≈60 FPS | |
| p95 interval | 16.7–16.8 ms | 16.7–16.8 ms | |

The transfer increase is 111,538 bytes including response overhead. Measured landing transfer rose by three bytes per viewport. The texture number comes from instrumented WebGL allocations with recognized formats. It includes mip levels and omits the same two unclassified allocations in each run. Browser frame cadence does not measure GPU execution time directly. Physical phone and Safari performance remain unverified.

ESLint, strict TypeScript, the production build, and all 17 Playwright checks passed. Browser coverage includes keyboard and touch travel, the project dialog, adaptive quality, reduced motion, direct portfolio access, and the new fallback for an unavailable ejecta texture. A separate manual browser run clicked the reflector, dismissed the panel with Escape, and switched to High with no browser errors.

The local review build is at [localhost:3115/explore](http://127.0.0.1:3115/explore).

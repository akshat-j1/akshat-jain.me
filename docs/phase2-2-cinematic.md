# Phase 2.2 · Cinematic lunar refinement

This records the incoming cinematic build. See the [final Phase 2.2 review](phase2-2-final.md) for the control fixes, terrain refinement, and matched comparisons across both baselines.

The first review build had a detailed foreground, while the outer terrain came from one compressed Copernicus patch with the same shading as the near ground. Its rim heights, material scale, and lighting read similarly across the frame. The updated scene keeps the ground under the player, the boulder placement, and the camera controls from that build. It adds a basin beyond the walking area so the crater shoulder, nearer slopes, and distant peaks read at different depths.

## Landscape and light

- Several irregular impact bowls flank the approach. Three offset escarpments form broken ridges and talus slopes behind them. Their underlying relief comes from two sampled windows of NASA's Orientale topography. Their sizes, shapes, and positions are composed for the interactive scene.
- A square grid keeps the former spacing across the playable area. Continuous radial rings put more samples across the visible outer slopes and fewer at the mesh boundary. The center and rings share vertices at the join and draw as one indexed mesh.
- The optional basin atlas blends in from 36 to 74 scene units away. That starts beyond the complete walking bounds. The renderer falls back to the previous Copernicus relief if the atlas fails to load.
- The ground keeps its near granular and ejecta materials. Distant exposed faces use a second scale of the existing packed texture, with filtered striations and changes in roughness. Lite retains the vertex tones and lower cost material.
- Paler ground reflectance, a cool fill and direct sunlight at about 15° bring out silver highlights and long shadows. The existing directional shadow pass and terrain shadow approximation carry the depth. Mobile guide text gets a stronger shadow so it remains readable over bright slopes.
- Earth moves higher in the composition so it clears the main saddle. Its rendered angular diameter is about 2.24° for this artistic pass, compared with about 1.9° before. Its existing maps receive richer ocean color, brighter daylight clouds, and a restrained blue limb. The sky keeps the faint procedural stars and the exposure response when looking upward.

The landscape direction drew on [NASA's Orientale impact basin visualization](https://svs.gsfc.nasa.gov/4499), [LRO's image of Mons Piton](https://science.nasa.gov/resource/on-and-around-mons-piton/), and the [CGI Moon Kit elevation data](https://svs.gsfc.nasa.gov/4720/). The scene is a fictional basin. Its peaks, exposure, and Earth placement are artistic choices. The terrain is a height field, which limits undercut cliff shapes. Some distant faces still lack the fine fractures of an actual photograph.

## Assets

The only new runtime asset is `public/lunar/basin-relief.png`, an 86,877-byte, 256 × 256 elevation atlas. The original input is the 16-pixel-per-degree LRO LOLA map from the NASA/GSFC CGI Moon Kit by Ernie Wright. The [asset ledger](asset-credits.md) records the source and reuse terms. The existing Copernicus, Poly Haven, and Solar System Scope assets continue to supply local elevation, regolith, and Earth maps. No dependencies were added. The atlas is decoded for CPU terrain generation and is not a new GPU texture.

The offline [atlas generator](../scripts/build-basin-relief.py) takes the original `ldem_16.tif` and writes the packed PNG. It uses NumPy and Pillow, which are needed only when rebuilding the asset. The red and green channels encode an elevation with a 1/64 scene-unit quantization step. The global TIFF stays outside the application.

## Matched desktop and portrait captures

The before build is the uncommitted Phase 2.2 first pass. The after build is this refinement. Each is a production browser capture. Comparisons use identical spawn coordinates, viewports and gestures. The relay view walks forward until inspection becomes available, then uses the same camera drag. The other views start at spawn, including Observe with an upward drag and a left-facing oblique view.

| View | Phase 2.2 first pass | Cinematic refinement |
| --- | --- | --- |
| Desktop 1440 × 900 spawn | [Before](screenshots/phase2-2-cinematic/before-desktop-spawn.jpg) | [After](screenshots/phase2-2-cinematic/after-desktop-spawn.jpg) |
| Desktop relay and near terrain | [Before](screenshots/phase2-2-cinematic/before-desktop-relay-ground.jpg) | [After](screenshots/phase2-2-cinematic/after-desktop-relay-ground.jpg) |
| Desktop Observe and Earth | [Before](screenshots/phase2-2-cinematic/before-desktop-sky.jpg) | [After](screenshots/phase2-2-cinematic/after-desktop-sky.jpg) |
| Desktop oblique | [Before](screenshots/phase2-2-cinematic/before-desktop-oblique.jpg) | [After](screenshots/phase2-2-cinematic/after-desktop-oblique.jpg) |
| Portrait 390 × 844 spawn | [Before](screenshots/phase2-2-cinematic/before-portrait-spawn.jpg) | [After](screenshots/phase2-2-cinematic/after-portrait-spawn.jpg) |
| Portrait relay and near terrain | [Before](screenshots/phase2-2-cinematic/before-portrait-relay-ground.jpg) | [After](screenshots/phase2-2-cinematic/after-portrait-relay-ground.jpg) |
| Portrait Observe and Earth | [Before](screenshots/phase2-2-cinematic/before-portrait-sky.jpg) | [After](screenshots/phase2-2-cinematic/after-portrait-sky.jpg) |
| Portrait oblique | [Before](screenshots/phase2-2-cinematic/before-portrait-oblique.jpg) | [After](screenshots/phase2-2-cinematic/after-portrait-oblique.jpg) |

## Performance and verification

Both builds were profiled on loopback in Chrome with ANGLE Metal on the same Apple M4. Each set used three cold contexts per viewport, Auto (Balanced) quality, and 2.4 seconds of held forward movement. Portrait is touch emulation using that same GPU. The drawing buffers were 1440 × 830 and 468 × 936 for desktop and portrait in both builds.

| Metric | Phase 2.2 first pass | Cinematic refinement |
| --- | ---: | ---: |
| Exploration asset transfer | 1,511,841 B | 1,599,018 B |
| Exploration asset requests on landing | 0 | 0 |
| Scene request to ready UI | 447–460 ms | 449–457 ms |
| Draw submissions per frame, including shadows | ~60.3 | ~60.3 |
| Submitted triangles per frame | ~284,500 | ~280,900 |
| Known texture storage allocations | 31,806,792 B | 31,806,792 B |
| Active browser cadence | ~60 FPS | ~60 FPS |
| p95 animation callback interval | 16.7–16.8 ms | 16.7–16.8 ms |

The refinement adds 87,177 bytes of exploration transfer, including response overhead. The combined Phase 2.2 increase over the Phase 2.1 checkpoint is 198,715 bytes, within the agreed 200 KB target. The draw and triangle figures remain under the Balanced targets of about 64 and 300,000. The texture number includes recognized WebGL texture allocations and their mip levels. Two unclassified allocations are excluded in each run. Browser callback cadence does not measure GPU execution time. Physical phone and Safari performance remain unverified.

ESLint, TypeScript, the production build, and all 19 Playwright tests passed. The new checks cover the fallback when the atlas is missing and verify that the basin leaves walking heights unchanged. A separate Chrome run verified reflector clicking, Escape, and the High rendering tier without browser errors.

The review build is running locally at [localhost:3115/explore](http://127.0.0.1:3115/explore).

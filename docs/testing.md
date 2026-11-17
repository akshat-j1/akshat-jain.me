# Verification

See [Phase 2.1 verification](phase2-1.md#local-preview-and-verification) for the latest build, screenshots and paired performance measurements.

## Final Phase 2 checks

The optimized production build passed:

```sh
npm run lint
npm run typecheck
npm run build
npm test
```

Lint and strict TypeScript completed cleanly. The build compiled and prerendered all seven App Router pages. Playwright passed all 15 tests in Chrome 158. Playwright’s bundled Chromium was not installed, so the suite used the system Chrome binary:

```sh
PLAYWRIGHT_CHROMIUM_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm test
```

The suite was run against the production build at `127.0.0.1:3103`. It covers these viewports: 320 × 568, 375 × 812, 390 × 844, 430 × 932, 768 × 1024, 1280 × 800, 1440 × 900, and 1920 × 1080. Checks include:

- Landing, portfolio and direct project links, with no 3D asset requests before entering Explore.
- Responsive canvas layout, no horizontal overflow, scene entry and repeat entry.
- Desktop keyboard movement, focus loss, touch movement, pointer cancellation and touch drag-to-look.
- Relay collision and proximity; Escape behavior, dialog pause, focus return and project navigation.
- Automatic quality reduction during simulated slow rendering; manual Lite quality selection.
- Reduced-motion, no JavaScript, failed model load, unavailable WebGL and WebGL context loss fallbacks.
- Frame-rate-independent simulation, bounds and relay collision, shared LOLA terrain/collision samples, and eased bounded astronaut toe correction.

Manual visual checks and final screenshots used the local production build. Three.js logs its upstream `Clock` deprecation notice through the current React Three Fiber stack. Chrome also reports that `WEBGL_lose_context` is unavailable on a context where the test deliberately simulates context loss; both notices are environmental and the tested fallbacks work.

## Phase 1 comparison

Three cold contexts were measured per viewport with the saved local profile. Phase 2 uses the optimized production build. The machine was macOS with Chrome 158, ANGLE Metal and Apple M4. The Phase 1 profile does not include server-mode metadata, so compare timings as indicative rather than as a controlled paired benchmark. Portrait is emulation on the same laptop, not a physical mobile GPU.

| Measurement | Phase 1 desktop | Phase 2 desktop | Phase 1 portrait emulation | Phase 2 portrait emulation |
| --- | ---: | ---: | ---: | ---: |
| Landing transfer | 448,957 B | 449,299 B | 332,451 B | 332,793 B |
| Encoded JavaScript | 138,540 B | 138,540 B | 138,540 B | 138,540 B |
| Scene assets before Explore | 0 | 0 | 0 | 0 |
| LCP range | 52–100 ms | 48–68 ms | 56 ms | 44–56 ms |
| CLS | 0 | 0 | 0 | 0 |
| Scene asset transfer | 1,130,088 B | 1,357,366 B | 1,130,088 B | 1,357,366 B |
| Scene request to ready UI | 458.5–467.5 ms | 448.4–459.2 ms | 456.1–458.4 ms | 453.3–457.7 ms |
| Active frame rate | ~60 FPS | ~60 FPS | ~60 FPS | ~60 FPS |
| Frame interval p95 | 16.7–16.8 ms | 16.7 ms | 16.7–16.8 ms | 16.7–16.8 ms |
| Instrumented draw calls per frame | ~41 | ~58 | ~41 | ~58 |

The Phase 2 scene transfers about 20% more data and submits about 41% more WebGL draw calls per frame; active animation stayed near 60 FPS on the M4. Draw calls were measured by wrapping WebGL submission methods during 2.4 seconds of movement; GPU execution time and long-session memory were not measured. Scene request to ready UI runs overlapped between versions. The exact method and limitations are documented in [the Phase 2 report](phase2.md).

## Physical-device check still needed

No physical iPhone/iPad or Android device was available in this run. To check one on the same Wi-Fi:

```sh
npm run dev -- --hostname 0.0.0.0
```

Open `http://<laptop-LAN-IP>:3000/explore` on the device. Verify first load, sustained walking and heat, terrain and shadows, orbit drag, directional holds and cancellation, portrait/landscape, relay discovery, reduced-motion behavior, and memory on return/re-entry. Record device model, OS/browser, scene quality, and observed frame stability before treating the mobile target as met.

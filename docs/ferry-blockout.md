# Eastern rim ferry · playable visual review

The survey ferry rests on a shelf east of the communications relay. From the dish, turn toward the pale hull showing past the fractured rock. Follow the saddle along the left side of that rock as you approach. The canopy and copper landing legs come into view first, followed by the hatch and stairs. Walk past the stairs toward the aft landing pad, then look west through the saddle to find the relay dish again.

## Walking-camera evidence

Both recordings start in the ordinary exploration scene and finish back at the relay with its MEETFLIX panel and Observe control. The desktop recording uses keyboard and mouse. The portrait recording uses emulated touch events on the direction buttons and the canvas. The images below were captured from those walks at the normal follow-camera height.

| View | Desktop · 1440 × 900 | Portrait · 390 × 844 |
| --- | --- | --- |
| First clear view through the saddle | [Desktop](screenshots/ferry-blockout/desktop-notch.jpg) | [Portrait](screenshots/ferry-blockout/portrait-notch.jpg) |
| Arrival on the shelf | [Desktop](screenshots/ferry-blockout/desktop-reveal.jpg) | [Portrait](screenshots/ferry-blockout/portrait-reveal.jpg) |
| Hatch and astronaut scale | [Desktop](screenshots/ferry-blockout/desktop-hatch.jpg) | [Portrait](screenshots/ferry-blockout/portrait-hatch.jpg) |
| Reverse view to the relay | [Desktop](screenshots/ferry-blockout/desktop-reverse.jpg) | [Portrait](screenshots/ferry-blockout/portrait-reverse.jpg) |
| Full round trip | [32-second desktop video](screenshots/ferry-blockout/desktop-walk.mp4) | [33-second portrait video](screenshots/ferry-blockout/portrait-walk.mp4) |

For the following comparison, both production builds used the same astronaut position and follow-camera heading near the relay, facing east. The outer shelf was beyond the previous walking boundary.

| Near-relay composition | Committed Moon | Ferry blockout |
| --- | --- | --- |
| Desktop | [Before](screenshots/ferry-blockout/desktop-before.jpg) | [After](screenshots/ferry-blockout/desktop-after.jpg) |
| Portrait | [Before](screenshots/ferry-blockout/portrait-before.jpg) | [After](screenshots/ferry-blockout/portrait-after.jpg) |

## Implementation

The crater rim masks part of the hull on the approach. The saddle, foot placement and playable shelf share the simulation's ground heights. The hull, pads and rim formations participate in walking and follow-camera collision. The site layout lives in `content/ferry-site.ts`. The world registers the hatch as the optional discovery point `moon/ferry`. An editor can assign a published project through its ordinary catalog entry. The current hatch has no project assignment or boarding action.

The hull plating, canopy and hardware use three batched meshes. The rock outcrop uses one mesh and one local photographic texture. The canopy approximates the reflected horizon in its material, avoiding a second scene render. The hull texture is generated locally when exploration mounts. The new geology texture has a fallback and appears in the [asset ledger](asset-credits.md).

## Production comparison

The reference build was `a8965d1c04b0b3573222f6c65d8d49e32288680a`. Each result is the median of three fresh Chrome sessions on the same Apple M4, using Auto quality on localhost. The samples used the same position near the relay, an east-facing camera and 2.4 seconds of forward input. Desktop drew at 1440 × 830. Portrait emulated a 390 × 844 touch device at DPR 2, with the scene drawing at 468 × 936. Physical-phone performance and thermals remain unmeasured.

| Active walking metric | Desktop before → after | Portrait before → after |
| --- | ---: | ---: |
| Browser animation callbacks per second | 60.0 → 60.0 | 60.0 → 60.0 |
| 95th-percentile frame interval | 16.8 → 16.7 ms | 16.7 → 16.7 ms |
| WebGL draw calls per frame, including shadows | 49.7 → 56.5 | 35.0 → 42.0 |
| Submitted triangles per frame, including shadows | 389,212 → 400,182 | 386,673 → 397,663 |
| First lunar asset request to scene controls ready | 464 → 500 ms | 468 → 478 ms |

The exploration assets added 96,978 transferred bytes under `/lunar/`, including response overhead. The landing page made zero exploration-asset requests in both builds. Tracked texture storage allocations rose from 48.33 to 52.33 MiB. This estimate covers recognized WebGL texture formats and excludes other GPU memory. The frame interval measures browser pacing on a 60 Hz display. It cannot establish the GPU headroom on a phone.

## Verification and visual judgment

ESLint, strict TypeScript, the production build and all 33 Playwright tests passed. The browser suite covers camera-relative movement, Observe, touch controls, keyboard interaction, direct portfolio routes, adaptive quality and fallback. A new simulation regression checks the extended walking boundary and hull collision. The additional desktop and touch round trips reached the hatch, returned to the relay, opened MEETFLIX and entered Observe without a page error.

In a separate production build with an empty catalog, the work index displayed its empty state. The same desktop walk reached the unassigned hatch, found no inspect prompt and returned to the relay. Pressing the inspection key at the relay kept the visitor in the scene.

The clearest full-hull composition is the first opening in the rocks. Closer in, the portrait camera crops the bow and emphasizes the astronaut and hatch. On the return, the dish is visible through the gap but small against the basin. The distant hills remain smooth and the rock faces angular. These are the visual limits to weigh before approving the flight stage.

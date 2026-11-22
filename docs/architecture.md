# Architecture

The original V0 page is served at `/` and `/coming-soon`. Its Coming soon link opens the cinematic landing at `/experience`. Both landing pages and the portfolio are App Router server components with ordinary links. `/explore` has server-rendered navigation and a browser-only shell. The shell checks capability and preference before dynamically importing React Three Fiber, Three.js, the GLB loader or any scene asset.

Simulation uses metre-like units, Y up and negative Z forward. A deterministic height function drives ground geometry and capsule grounding. A fixed collision layout defines the relay footprint, boulders and walkable bounds. Input supplies a normalized direction to the simulation. The player rig and camera read the same result. The shell sees only changes in nearby station, readiness and rendering quality. The server builds the portfolio and each destination’s discovery bindings from content/projects.ts. World-owned locations live in content/worlds.ts. Only short summaries assigned to the Moon cross the exploration client boundary. See the [portfolio editing guide](phase-3-proposal.md#editing-the-milestone-1-implementation).

The React Three Fiber world owns the canvas, meshes and animation. A LOLA elevation patch drives both terrain mesh and collision height. Regolith albedo and normal maps add fine detail; rocks and footfall grains are instanced. A directional key, diffuse fill and shadow map establish depth. The globe, cloud shell, antenna servo, and astronaut breathing use low-rate invalidation while idle and normal frame rates while moving. The loop sleeps in hidden tabs and behind the project dialog.

Camera look input lives in the DOM shell, separate from walker input. Dragging the scene changes a damped third-person orbit, and Observe increases camera distance. Touch movement controls retain pointer capture; open scene area handles look gestures. Quality profiles cap DPR, adjust terrain detail and shadows, and step down on consistently slow active frames. Reduced motion, missing assets, WebGL failure, and context loss retain the direct portfolio route.

A native dialog owns project panel focus. Input is cleared on opening a dialog, losing focus, pointer cancellation and route exit. The direct portfolio is the alternative for reduced motion, loading failures, context loss, and unavailable WebGL.


The current exploration shell coordinates three visible modes. Walking accepts camera-relative input and one-shot jump requests. The overview freezes simulation and interpolates a bounded orbit, with the saved walking look restored on return. The native map dialog pauses input and takes a pose snapshot at open time. Scene frame data stays in refs. The map builds contours from the shared terrain height function when opened.

World definitions own the relay, ferry, Orrery and Archive. Scenic demo content fills unassigned installations through withScenicEntries. A real catalog assignment always takes precedence at the same stable world/installation ID. Map details, proximity panels and project links consume these resolved bindings. The authored demo descriptions remain outside the published portfolio records.

Airborne motion integrates velocity with substeps and lands on the same height function that builds the terrain. Horizontal collision stays active during jumps. Footprints and dust emit while grounded. The pose animation blends to a relaxed leg tuck during airtime.


## Cinematic personal portfolio

The homepage, work index and individual project briefs are static Server Components. `content/projects.ts` supplies project content and optional presentation data; `content/profile.ts` supplies personal content and toolkit evidence IDs. Catalog validation includes presentation covers. The homepage filters explicit `featured` flags, while `/work` includes all published entries. Names and URLs for toolkit evidence are resolved against published records before crossing the client boundary.

Only the header disclosure behavior, toolkit selection and progressive motion are client components. Input and simulation code is not imported by these pages. IntersectionObserver handles one-time reveals and offscreen ambient suspension; scroll updates are coalesced in requestAnimationFrame and do not use React state. The essential content and native links work without JavaScript. Reduced motion disables all portfolio animation and reveals never gate content access.

`/experience` is a permanent redirect to `/`, avoiding a duplicate landing page. `/coming-soon` preserves the V0 page as a noindex archive. Existing project IDs, retirement redirects and the MEETFLIX relay binding are preserved. Exploration Exit and brand links now lead directly to `/`. No new runtime dependency was added.

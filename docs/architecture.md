# Architecture

The original V0 page is available at /coming-soon on this branch. The new landing and portfolio are App Router server components with ordinary links. /explore has server-rendered navigation and a browser-only shell. The shell checks capability and preference before dynamically importing React Three Fiber, Three.js, the GLB loader or any scene asset.

Simulation uses metre-like units, Y up and negative Z forward. A deterministic height function drives ground geometry and capsule grounding. A fixed collision layout defines the relay footprint, boulders and walkable bounds. Input supplies a normalized direction to the simulation. The player rig and camera read the same result. The shell sees only changes in nearby station, readiness and rendering quality. Shared content lives in content/projects.ts.

The React Three Fiber world owns the canvas, meshes and animation. A LOLA elevation patch drives both terrain mesh and collision height. Regolith albedo and normal maps add fine detail; rocks and footfall grains are instanced. A directional key, diffuse fill and shadow map establish depth. The globe, cloud shell, antenna servo, and astronaut breathing use low-rate invalidation while idle and normal frame rates while moving. The loop sleeps in hidden tabs and behind the project dialog.

Camera look input lives in the DOM shell, separate from walker input. Dragging the scene changes a damped third-person orbit, and Observe increases camera distance. Touch movement controls retain pointer capture; open scene area handles look gestures. Quality profiles cap DPR, adjust terrain detail and shadows, and step down on consistently slow active frames. Reduced motion, missing assets, WebGL failure, and context loss retain the direct portfolio route.

A native dialog owns project panel focus. Input is cleared on opening a dialog, losing focus, pointer cancellation and route exit. The direct portfolio is the alternative for reduced motion, loading failures, context loss, and unavailable WebGL.

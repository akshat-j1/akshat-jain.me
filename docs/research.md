# Phase 1 research

The pasted Lunar Field Log brief defines scope. The attached Research, Five Concepts and Build Blueprint is a reference for voice, palette, compact traversal and direct access. Its scroll/sprite implementation, extra site routes and migration alternatives are outside this slice.

## Interactive references

| Reference | Observed or accessible material | Application to this slice |
| --- | --- | --- |
| [Bruno Simon](https://bruno-simon.com/) | Page markup exposes active navigation and an explicit interaction control. | Short walk to a readable landmark, deliberate interaction, and conventional site navigation beside the scene. |
| [Lusion](https://lusion.co/) | Studio and work pages describe 3D visual storytelling and give the image hierarchy priority. | One composed opening frame, a distinct playable framing, and few text surfaces over the scene. |
| [Dennis Snellenberg](https://dennissnellenberg.com/) | Public work and archive structure were accessible. | The direct portfolio uses large type, sparse rows, and obvious routes. |
| [Maxime Heckel](https://blog.maximeheckel.com/posts/real-time-cloudscapes-with-volumetric-raymarching/) | Read an authored discussion of noise, light and volumetric rendering. | Layered variation carries terrain detail. The exposed lunar surface uses single-source light and sparse geometry without atmospheric volumes. |
| [Awwwards Three.js gallery](https://www.awwwards.com/websites/three-js/) and [Codrops Podium case study](https://tympanus.net/codrops/2026/06/23/podium-building-a-website-where-running-becomes-storytelling/) | The Awwwards homepage timed out and the Codrops homepage returned HTTP 403. The gallery and project author’s indexed case study were accessible. | The scene uses a simple embodied action, with responsive composition and a separate plain work index. |
| [Journey creator interview](https://blog.playstation.com/archive/2017/03/15/on-the-fifth-anniversary-of-journeys-release-its-creator-reflects-on-the-games-legacy/feed/) | Studied the creator’s account of tone and player experience. | A strong landmark and ground relief guide the visitor with little interface chrome. |
| [Apollo 15 Press Kit](https://science.nasa.gov/wp-content/uploads/2023/09/Apollo_15-1.pdf) | The lunar communications relay used a recognizable high-gain antenna and an equipment case. | The dish reads as a landmark. Its struts and feed create a distinctive silhouette without labels covering the image. |
| [NASA 3D Resources](https://science.nasa.gov/3d-resources/), [NASA media guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/), [Poly Haven](https://polyhaven.com/license) and [Sketchfab](https://sketchfab.com/licenses) | NASA assets and media terms, Poly Haven’s CC0 terms, and the selected terrain texture were accessible. Sketchfab’s licensing page returned HTTP 403. | Kept the CC0 skinned model and Poly Haven regolith; Phase 2 adds a compact crop of NASA LOLA elevation data and credited Earth textures under CC BY 4.0. The runtime has no remote asset requests. |

## Interface and motion intake

- [Skiper UI](https://skiper-ui.com/), [VengenceUI](https://www.vengenceui.com/) and [AnimMasterLib](https://animmasterlib.dev/) were accessible. Explored their catalog patterns for section entrance, staggered reveal and quieter hover states. A CSS opacity and translation entrance provides the applicable part in one short motion.
- [React Bits](https://reactbits.dev/), [Aceternity](https://ui.aceternity.com/) and [Magic UI](https://magicui.design/) were accessible at their public entries. React Bits returned a limited client-rendered shell. Text reveals and scrolling layouts were considered, with a live readable heading and a native modal selected for the slice.
- [Osmo](https://www.osmo.supply/) was accessible at the public catalog. Its interaction and transition catalog is a reference for purposeful sequencing. No member-only component is used.
- [Motion](https://motion.dev/) provides layout, gesture and scroll motion. [GSAP](https://gsap.com/) provides explicit timelines, labels and context cleanup, a useful fit for later authored sequences. The Phase 1 entrance uses CSS and skeletal motion uses Three’s AnimationMixer. Adding a second motion engine would duplicate these responsibilities.

## Runtime selection

The public [Game Studio](https://github.com/openai/plugins/tree/main/plugins/game-studio), [Build Web Apps](https://github.com/openai/plugins/tree/main/plugins/build-web-apps), [OpenAI Skills](https://github.com/openai/skills), and [official GSAP skills](https://github.com/greensock/gsap-skills) repositories were checked. The available local Game Studio foundation, React Three Fiber, asset pipeline, game UI and playtest skills informed module boundaries and verification. Frontend builder, frontend testing, React performance and ImageGen informed design, lazy loading, and browser validation. GSAP skill installation is unnecessary for the CSS entrance.

[R3F installation](https://r3f.docs.pmnd.rs/getting-started/installation) and [scaling guidance](https://r3f.docs.pmnd.rs/advanced/scaling-performance) informed selection of React Three Fiber 9 for React 19 and demand rendering. The npm peer range for R3F 9.8.2 was checked against this lockfile’s React 19 version. [MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices) informed DPR caps, resource lifetime and capability checks. The scene uses one Three renderer, custom terrain collision, native pointer capture and an HTML dialog. No Drei, Rapier, GSAP, Motion or component-library dependency was needed in Phase 1.

## Phase 2 environment sources

The [NASA CGI Moon Kit](https://svs.gsfc.nasa.gov/4720/) documents the 16 pixels per degree LDEM as half-metre unsigned integers, offset by 20,000 from elevations relative to a 1,737,400 m radius. The source is derived from LRO's LOLA gridded elevation product. A 512 × 512 near-side crop stores normalized, center-relative relief in a compact local PNG. A shared bilinear height sampler feeds both rendered terrain and the walker's ground-contact calculation. This keeps the source TIFF out of the application and adds about 76 KB to the local scene assets. [Phase 2.1](phase2-1.md) adds a second crop for measured relief around Copernicus.

The [Solar System Scope texture library](https://www.solarsystemscope.com/textures/) supplies the equirectangular Earth surface map and separate cloud mask under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The scene uses a lit sphere, a slightly faster cloud shell, and a small atmosphere rim. They are local assets; no Earth tile service or remote runtime host is used.

No library was added. The world uses the existing Three.js and React Three Fiber dependencies, a custom elevation sampler, instanced geology and footfall grains, a small Earth shader, and low-rate demand rendering for idle animation. Dense volumetric atmosphere, heavy post-processing and the 31.7 MB NASA global DEM are not shipped.

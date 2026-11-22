# Asset and component ledger

All browser assets are local. Sizes are file bytes before HTTP transfer encoding.

| File | Source and author | Rights and attribution | Preparation | Source → shipped bytes |
| --- | --- | --- | --- | ---: |
| `public/lunar/astronaut.glb` | [Astronaut in Spacesuit](https://grab3d.com/models/characters/astronaut-in-spacesuit/?anim=walk), Grab3D | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). No attribution required; voluntary credit in the colophon. | Neutralized the saturated orange panels in the 1024 px base-color texture, reduced suit metalness, retained the walk rig, and rebuilt with glTF Transform Meshopt optimization. No replacement mesh or runtime dependency. | 13,986,112 → 894,860 |
| `public/lunar/regolith.webp` | [Gravelly Sand](https://polyhaven.com/a/gravelly_sand), Dario Barresi / Poly Haven | [CC0](https://polyhaven.com/license). No attribution required. Voluntary credit in the colophon. | 1K diffuse, desaturated and downsampled to 768 px WebP. | 1,062,525 → 127,684 |
| `public/lunar/regolith-normal.webp` | [Gravelly Sand](https://polyhaven.com/a/gravelly_sand), Dario Barresi / Poly Haven | Same CC0 grant. | 1K GL normal, downsampled to 768 px WebP. | 1,387,739 → 194,628 |
| `public/lunar/ejecta-detail.webp` | Original procedural fragment relief by Lunar Field Log | Project-authored. No source photograph or scan is embedded. | Seamless 384 × 384 lossless WebP. Red and green encode tangent-space normal components and blue encodes fragment coverage. Used for the coarse regolith layer in Balanced and High. | 111,238 |
| `public/lunar/earth-albedo.webp`, `earth-clouds.webp` | [Earth and cloud textures](https://www.solarsystemscope.com/textures/), Solar System Scope | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Attribute Solar System Scope; retain their credit in the colophon. | Equirectangular day map and separate grayscale cloud layer; each resized to 1024 × 512 WebP for a lit sphere and independently animated outer shell. Source JPEGs: 463,087 B and 965,676 B. | 1,428,763 → 203,120 |
| `public/lunar/lunar-height.png` | [NASA CGI Moon Kit, LOLA elevation map](https://svs.gsfc.nasa.gov/4720/), Lunar Reconnaissance Orbiter Lunar Orbiter Laser Altimeter team | NASA/GSFC scientific visualization data; source values derive from LRO LOLA global gridded elevation products. | A 512 × 512 crop near 0° latitude, 23.5° east from the 16 px/degree, half-metre map. Center-relative elevations are stored in an 8-bit ±7 km window. The shared sampler drives visible terrain and walker contact. The 31.7 MB global TIFF is not shipped. | 33,201,026 → 76,295 |
| `public/lunar/copernicus-relief.png` | [NASA CGI Moon Kit, 16 px/degree LOLA map](https://svs.gsfc.nasa.gov/4720/), NASA/GSFC and the LRO LOLA team. CGI Moon Kit by Ernie Wright. | NASA scientific data reused under the [NASA media usage guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/). Source credited in the colophon. | 169 × 169 crop centered at 20° W, 8.5° N. North maps to negative Z. The PNG's red and green channels store the untouched high and low bytes of each 16-bit half-meter sample. Regional relief blends into the existing local sample around the trail. | 33,201,026 → 42,637 |
| `public/lunar/basin-relief.png`, `crater-surface.webp` | [SLDEM2015](https://pgda.gsfc.nasa.gov/products/54), NASA/GSFC LRO LOLA and JAXA SELENE Terrain Camera. [Barker et al., Icarus](https://doi.org/10.1016/j.icarus.2015.07.039). | Publicly released planetary elevation measurements. The producer requests citation when using the dataset. Credit is shown in the site colophon. The PDS3 label specifies no separate Creative Commons license. | Authored height, slope and illumination derivatives from the 512 pixels/degree [PDS tile](https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/sldem2015/tiles/float_img/sldem2015_512_00n_30n_315_360_float.lbl). A 320 × 320 geometry atlas and 1024 × 1024 surface atlas share a 3.3° window centered near 339.23° E, 9.86° N. Measured central uplifts and a scanned bedrock exposure are recomposed around the basin. Build with `scripts/build-basin-relief.py` and the source Rock Face 01 glTF. | 179,290 / 344,232 |
| `public/lunar/trail-impacts.png` | SLDEM2015, same PDS product and citation above. | Published scientific elevation data. | Twelve source bowls, fitted to the local ground plane and rescaled around the route. A 384 × 384 single-channel PNG drives both the terrain mesh and walking height. | 26,332 |
| `public/lunar/moon_rock_02.glb`, `moon_rock_05.glb` | [Moon Rock 02](https://polyhaven.com/a/moon_rock_02) and [Moon Rock 05](https://polyhaven.com/a/moon_rock_05), photography by Greg Zaal and Rico Cilliers, processed by Jenelle van Heerden. | [Poly Haven CC0](https://polyhaven.com/license). | Reduced meshes with embedded 512 px diffuse and normal maps. Used as rock analogues at multiple scales. | 64,336 / 62,980 |
| `public/lunar/fault-rock.webp` and scarp geometry baked into the two outer terrain atlases | [Rock Face 03](https://polyhaven.com/a/rock_face_03), photography by Dario Barresi, processing by Rico Cilliers. [Rock Face 01](https://polyhaven.com/a/rock_face_01) by Dario Barresi. | Poly Haven CC0. | Rock Face 03 grayscale albedo, occlusion and two normal components packed into one 512 px data map. The offline baker rasterizes Rock Face 01 geometry into the elevation field before computing terrain illumination. | 85,460 for the material |
| `public/lunar/rim-strata.webp` | [Rock Face 01](https://polyhaven.com/a/rock_face_01), Dario Barresi. | [Poly Haven CC0](https://polyhaven.com/license). | Grayscale orthographic reprojection of the scan’s diffuse UVs onto the face tangent plane. Cropped to the central exposure and reduced to 512 × 512 for the eastern outcrops. | 96,678 |
| Survey ferry and rim geometry | Original modeled geometry and enamel panel artwork for Lunar Field Log. | Project artwork. | Batched pressure shell, glazing, landing gear and hatch. The panel atlas is drawn locally at scene creation. | Included in exploration code |
| `public/lunar/galactic-light.webp`, `bright-stars.bin` | [Deep Star Maps 2020](https://svs.gsfc.nasa.gov/4851/), NASA/Goddard Space Flight Center Scientific Visualization Studio, Ernie Wright. Gaia DR2 credit: ESA/Gaia/DPAC. Bright sources include Hipparcos-2 and Tycho-2. | NASA scientific visualization with agency and catalog attribution. [NASA media guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/). | Local display-exposure derivative of the 4K galactic Milky Way EXR. A separate point buffer samples 7,200 bright local maxima in the accompanying Hipparcos/Tycho EXR. Positions use the same galactic projection as the sky map. | 87,970 / 57,600 |
| `public/lunar/opening.webp`, `opening-portrait.webp` | Original generated opening artwork, OpenAI ImageGen built-in | Project-generated artwork. No third-party asset or attribution. Explicitly captioned as an artist’s impression. | 1536 × 1024 WebP and separately cropped 696 × 704 portrait WebP. | 2,566,001 → 204,952 / 88,446 |
| `app/fonts/*.woff2` | Existing V0 Instrument Serif and Inter subsets | SIL Open Font License 1.1. License texts are adjacent to fonts. | Carried forward unchanged. | 15,684 / 15,040 / 48,432 |
| `app/favicon.ico` | Original AJ icon from V0 | Project asset. | Carried forward unchanged. | 6,527 |
| Scene meshes created in `components/explore/` | Original terrain shaping, instanced rocks, relay hardware, Earth atmosphere shell and starfield | Project-authored geometry and shaders. NASA LOLA heights and Poly Haven normal/albedo textures are separately credited above. | Locally generated meshes; no shipped 3D environment model. | Runtime geometry |

## Component and animation ledger

No external UI component source was copied. The header, controls, portfolio and disclosure UI use original CSS, HTML, and native dialog. Three.js and React Three Fiber are MIT dependencies. Playwright is Apache-2.0 and used for development tests. Their upstream license text ships with each npm package.

## Opening image generation

Built-in OpenAI ImageGen prompt:

> High-end cinematic website hero photographic plate, WIDE landscape 3:2 (will crop to 16:9 centered). No text, no letterforms, no interface. Color-negative architectural photography for a premium lunar exhibition, believable Apollo era lunar expedition. Precisely composed from waist-high position: a single realistic full-body white bone human astronaut with ribbed suit, backpack and dark glass visor stands on the RIGHT third (x=72%, head y=43%, feet y=80%) viewed from behind three quarters towards the horizon, mostly side-lit with hard bright sunlight from upper left, collecting no samples. Small distant partially lit blue-white Earth at x=79%, y=25%, on an almost black pure sky occupying the upper 53%. jagged dusty lunar ridges across horizon globally y=54%, uneven fine gray regolith, distinct rocks, depressions and long ink-black shadows in foreground, vast isolation. Left 46% specifically quiet and darker near black and charcoal because ivory type will be laid over it in HTML. Earth is small like a distant world. Classical landscape frame, striking contrast in grayscale values, dark gray/black and warm silver with extremely restrained hints of Earth blue. Neither dramatic fog, fantasized clouds, orange tint, lens flares, flags, graphics, logotypes, branded suit patches nor artificial neon. Premium still from a quiet documentary, rich fine textural detail.

## Regenerating the ship asset

Download the licensed rigged source from Grab3D. Install the [glTF Transform CLI](https://gltf-transform.dev/cli) outside the application dependency tree and run:

```sh
gltf-transform optimize astronaut-source.glb public/lunar/astronaut.glb \
  --compress meshopt --simplify-ratio 0.17 --simplify-error 0.003 \
  --texture-size 1024 --texture-compress webp --instance false --palette false
```


## Cinematic exploration upgrade

The Orrery, Archive, route lamps, distant courier, ringed world, terrain refinements, map and associated shader artwork are authored in this repository. They use the existing Three.js primitives and locally loaded surface assets. The scenic text is explicitly marked as an interactive world demo. MEETFLIX retains its verified name and preparation status.

The local survey-opening.webp and survey-opening-portrait.webp are browser captures of the implemented world. Their underlying spacesuit, rock, terrain, sky and Earth assets retain the licenses listed above. The original generated opening images remain available in the source history and assets. No research artwork was imported into the scene.

Vercel React Best Practices is MIT-licensed guidance. Anthropic Frontend Design was reviewed from its official repository as process guidance. Neither adds a runtime dependency.

## Cinematic personal portfolio — 21 November 2026

| Local asset | Source / reuse basis | Preparation and scope |
| --- | --- | --- |
| `public/portfolio/orbital-arrival.webp` | Original artwork created with built-in OpenAI ImageGen for this website, without a reference image. No third-party photography embedded or paid stock purchased. | 1536 × 1024, 43,646 bytes. Decorative planetary art, not a NASA photograph or a screenshot of the playable renderer. Original PNG retained outside the repository. |
| `public/portfolio/meetflix-office.webp` | [Akshat’s MEETFLIX original effect background](https://github.com/akshat-j1/meetflix/blob/main/public/fine/office.webp); [source notice](https://github.com/akshat-j1/meetflix/blob/main/public/fine/ASSET-NOTICES.md) identifies original ImageGen art without copied film/comic imagery. User explicitly requested reuse of verified project materials for their portfolio. Source blob `4a2335f51acd51278096699c562281625fd4425f`. | Resized to 1440 × 810, 143,872 bytes. Captioned as original effect artwork, not a live meeting. No models, runtime code or third-party inference assets redistributed. |
| `public/portfolio/meetflix-qa.webp` | [Synthetic QA frame](https://github.com/akshat-j1/meetflix/blob/main/docs/qa/fine-v062.png), same user-owned project. Source blob `17a8f3be5d68430bc92888f7ad441b4198b313b0`. | 1280 × 720, 63,182 bytes. Explicitly labeled synthetic QA, not a real participant or customer meeting. Lazy-loaded only on the MEETFLIX page. |
| `public/portfolio/portrait-ascii.webp` | [Akshat’s profile illustration](https://github.com/akshat-j1/akshat-j1/blob/main/assets/portrait-ascii.png). The profile describes the source as his illustration; reuse is within the requested personal portfolio. Source blob `020ff12a5edcb72dbd5a7aa1650c426e1f571c61`. | 504 × 744, 107,764 bytes. Identified as an ASCII illustration, not a photograph. |
| Weather signal field and language typography study | Original HTML/CSS artwork in the reusable project presentation component. Labels and content come from the catalog. | Explicitly illustrative. No fictional weather values, test scores or accreditation. No asset downloaded at runtime. |
| Expedition previews `/lunar/survey-opening.webp` and `survey-opening-portrait.webp` | Existing browser capture of the implemented world, as documented in the earlier survey-opening ledger entry. Underlying spacesuit, terrain, rock, sky and Earth rights remain as listed above. | Reused without changing the 3D scene. Caption identifies an in-browser capture. |

The public project repositories do not declare an open-source license in GitHub metadata. Reuse here is the owner’s requested reuse of their own portfolio material; this ledger does not grant a general public redistribution license. The weather repository’s design reference image was inspected but excluded: it contains sample impact figures, official-government wording and third-party map imagery that should not be presented as this demo’s verified outcome.

### Portfolio arrival generation brief

> Create an original cinematic photographic space background plate for Akshat Jain’s personal developer portfolio. Widescreen landscape 1536 by 1024 or wider. Absolutely no text, letters, logos, interface or people. Restrained cinematic photography. A colossal dark terrestrial planet sweeps through the lower half; pale silver-blue atmospheric rim and a small restrained amber sunrise on the far-right horizon. Subtle mineral surface, dark seas and fine clouds. Upper 55 percent clean deep midnight navy negative space, a few faint stars, one small distant moon upper right. Quiet, majestic scale, plausible lighting, no purple nebula, dense galaxy, lens-flare streak, neon glow, diagrams, rings, spacecraft or spiky mountains. Center upper half stays dark for ivory HTML typography.

Original generation was text-to-image using no referenced artwork. The repository stores only the optimized WebP.

## Flight Log homepage

All three assets below are original fictional artwork generated for this project with OpenAI ImageGen from text prompts. No reference images, stock assets or third-party character designs were used. The spacecraft and robot were generated with transparency so the browser can move them independently.

| Local file | Generation brief |
| --- | --- |
| `public/flight/ringed-horizon.webp` | A copper volcanic landscape beneath a giant dark ringed planet. Open plum sky on the left for page text. |
| `public/flight/survey-ferry.webp` | An ivory and burgundy needle-nose survey craft with sculpted fins and warm engine cores, seen from below in three-quarter view. |
| `public/flight/survey-robot.webp` | A lavender ceramic survey robot with orange pixel eyes, small thrusters and one raised hand. |

PNG originals were encoded as WebP locally. The existing project artwork remains available for the work pages and previous review.

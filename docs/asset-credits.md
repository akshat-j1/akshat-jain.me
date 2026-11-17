# Asset and component ledger

All browser assets are local. Sizes are file bytes before HTTP transfer encoding.

| File | Source and author | Rights and attribution | Preparation | Source → shipped bytes |
| --- | --- | --- | --- | ---: |
| `public/lunar/astronaut.glb` | [Astronaut in Spacesuit](https://grab3d.com/models/characters/astronaut-in-spacesuit/?anim=walk), Grab3D | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). No attribution required; voluntary credit in the colophon. | Neutralized the saturated orange panels in the 1024 px base-color texture, reduced suit metalness, retained the walk rig, and rebuilt with glTF Transform Meshopt optimization. No replacement mesh or runtime dependency. | 13,986,112 → 894,860 |
| `public/lunar/regolith.webp` | [Gravelly Sand](https://polyhaven.com/a/gravelly_sand), Dario Barresi / Poly Haven | [CC0](https://polyhaven.com/license). No attribution required. Voluntary credit in the colophon. | 1K diffuse, desaturated and downsampled to 768 px WebP. | 1,062,525 → 127,684 |
| `public/lunar/regolith-normal.webp` | [Gravelly Sand](https://polyhaven.com/a/gravelly_sand), Dario Barresi / Poly Haven | Same CC0 grant. | 1K GL normal, downsampled to 768 px WebP. | 1,387,739 → 194,628 |
| `public/lunar/earth-albedo.webp`, `earth-clouds.webp` | [Earth and cloud textures](https://www.solarsystemscope.com/textures/), Solar System Scope | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Attribute Solar System Scope; retain their credit in the colophon. | Equirectangular day map and separate grayscale cloud layer; each resized to 1024 × 512 WebP for a lit sphere and independently animated outer shell. Source JPEGs: 463,087 B and 965,676 B. | 1,428,763 → 203,120 |
| `public/lunar/lunar-height.png` | [NASA CGI Moon Kit, LOLA elevation map](https://svs.gsfc.nasa.gov/4720/), Lunar Reconnaissance Orbiter Lunar Orbiter Laser Altimeter team | NASA/GSFC scientific visualization data; source values derive from LRO LOLA global gridded elevation products. | A 512 × 512 crop near 0° latitude, 23.5° east from the 16 px/degree, half-metre map. Center-relative elevations are stored in an 8-bit ±7 km window. The shared sampler drives visible terrain and walker contact. The 31.7 MB global TIFF is not shipped. | 33,201,026 → 76,295 |
| `public/lunar/copernicus-relief.png` | [NASA CGI Moon Kit, 16 px/degree LOLA map](https://svs.gsfc.nasa.gov/4720/), NASA/GSFC and the LRO LOLA team. CGI Moon Kit by Ernie Wright. | NASA scientific data reused under the [NASA media usage guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/). Source credited in the colophon. | 169 × 169 crop centered at 20° W, 8.5° N. North maps to negative Z. The PNG's red and green channels store the untouched high and low bytes of each 16-bit half-meter sample. Regional relief blends into the existing local sample around the trail. | 33,201,026 → 42,637 |
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

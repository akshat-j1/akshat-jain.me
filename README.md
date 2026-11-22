# akshat-jain.me

The local homepage follows a spacecraft from liftoff to a lunar survey robot. Scroll through the journey, wave to the robot, or use the header to go directly to the portfolio. The playable Moon is at `/explore`, and project details are at `/work`. `/experience` redirects to the homepage, and the original V0 page is archived at `/coming-soon`.

See the [flight storyboard](docs/flight-storyboard.md) for the current design and [portfolio content research](docs/portfolio-content.md) for project sources.

## Local development

Use Node.js 20.9 or later.

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). Use WASD or the arrow keys to walk, drag the scene to look around, and select Observe for a wider view. Press Space or use Jump for a low-gravity leap. Press M or select Map to inspect locations. World overview (O) pulls the camera back and Return to Exploration restores the walking view. Press E or use the inspect button when an installation is within reach. Escape closes the station. On a touch screen, hold a directional button to walk and drag open ground to look. Portfolio and Exit remain available in the navigation.

```sh
npm run lint
npm run typecheck
npm run build
npm test
```

Playwright starts the built site on localhost port 3100. Set `PLAYWRIGHT_BASE_URL` to check an already running build. If Playwright's Chromium is unavailable on macOS, the suite accepts a local Chrome executable with `PLAYWRIGHT_CHROMIUM_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'`.

See [architecture](docs/architecture.md), [creative direction](docs/creative-direction.md), [roadmap](docs/roadmap.md), [Phase 2 report](docs/phase2.md), [research](docs/research.md), [asset credits](docs/asset-credits.md) and [testing](docs/testing.md).

The [cinematic exploration report](docs/cinematic-upgrade.md) contains controls, browser comparisons, rendering measurements and visual limitations.

# akshat-jain.me

Lunar Field Log is an interactive portfolio prototype for Akshat Jain. The Phase 1 vertical slice includes the opening, one playable lunar traversal and the MEETFLIX relay. The approved V0 page is also available at `/coming-soon` on this branch.

## Local development

Use Node.js 20.9 or later.

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). Use WASD or the arrow keys to walk, drag the scene to look around, and select Observe for a wider view. Press E or use Inspect relay when the station is within reach. Escape closes the station. On a touch screen, hold a directional button to walk and drag open ground to look. Portfolio and Exit remain available in the navigation.

```sh
npm run lint
npm run typecheck
npm run build
npm test
```

Playwright starts the built site on localhost port 3100. Set `PLAYWRIGHT_BASE_URL` to check an already running build. If Playwright's Chromium is unavailable on macOS, the suite accepts a local Chrome executable with `PLAYWRIGHT_CHROMIUM_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'`.

See [architecture](docs/architecture.md), [creative direction](docs/creative-direction.md), [roadmap](docs/roadmap.md), [Phase 2 report](docs/phase2.md), [research](docs/research.md), [asset credits](docs/asset-credits.md) and [testing](docs/testing.md).

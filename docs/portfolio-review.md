# Cinematic personal portfolio — visual review

Implemented locally on `codex/cinematic-portfolio`, based on `513def294d55cc294c65f1b2f9a2a5c365f48608`. Review date: 21 November 2026.

Preview: http://127.0.0.1:3200

The homepage milestone is ready for the user’s visual review. No claim is made that passing tests establishes artistic success. No commit, push, merge or deployment was performed. Production remains unchanged.

## Implemented

- A complete server-rendered homepage with an original planetary arrival, oversized personal typography, three individually composed project showcases, a personal ASCII portrait and About section, keyboard-operable toolkit, building philosophy, optional lunar expedition and verified social links.
- A shared typed catalog for the homepage, `/work`, project briefs and lunar discovery. Published records can be featured explicitly; cover images and editorial studies are optional. Toolkit evidence names and URLs resolve from current published records.
- Verified MEETFLIX, National Weather Big Data Analytics Platform and LinguaCert AI content. MEETFLIX’s stable URL, relay assignment and case-study preparation status are preserved. Weather is described as a demo; LinguaCert as in development.
- Matching `/work` and individual project-page styling, with genuine source links, project boundaries and optional media. Weather and language artwork is explicitly illustrative; MEETFLIX’s QA frame is explicitly synthetic.
- `/experience` permanently redirects to `/` (308). V0 is preserved at `/coming-soon` with noindex metadata. Exploration Exit and brand links return to the actual homepage.
- Scoped CSS motion, gentle planetary drift and parallax, one-time content reveals, project image hover response, minimal progress indication, a motion pause control and offscreen suspension. Reduced motion disables portfolio animation. Native links and project content work without JavaScript.
- Responsive disclosure navigation, visible keyboard focus, a working skip-to-main target, tab keyboard interaction and locally optimized artwork. No runtime dependency, CMS, database, authentication, remote font, analytics or WebGL engine added to the homepage.

The exploration geometry, simulation, camera, input and rendering source files were not modified. The new homepage is an introduction to the existing world, not a claim that the lunar renderer has been rebuilt.

## Actual browser captures

These are captures of the implemented production build. The opening planetary image is original decorative artwork inside the website; the screenshots and walkthrough show real browser rendering and real interactions.

| View | Desktop | Portrait mobile |
| --- | --- | --- |
| Arrival | [1440 × 900](screenshots/portfolio/desktop-hero.png) | [390 × 844](screenshots/portfolio/mobile-hero.png) |
| Complete page | [Full desktop page](screenshots/portfolio/desktop-full.jpg) | [Full mobile page](screenshots/portfolio/mobile-full.jpg) |
| Work | [Desktop work](screenshots/portfolio/desktop-work.jpg) | [Mobile work](screenshots/portfolio/mobile-work.jpg) |
| About | [Desktop About](screenshots/portfolio/desktop-about.jpg) | [Mobile About](screenshots/portfolio/mobile-about.jpg) |
| Expedition | [Desktop expedition](screenshots/portfolio/desktop-expedition.jpg) | [Mobile expedition](screenshots/portfolio/mobile-expedition.jpg) |

[Browser animation walkthrough](screenshots/portfolio/portfolio-walkthrough.mp4): 17.28 seconds, 1440 × 900, H.264 MP4, 25 fps capture, approximately 2.47 MB. It shows the real scroll/reveal sequence and toolkit selection. The recording was encoded for convenient playback; no visual effects or concept frames were added. Video capture cadence is separate from the rendering-frame measurements below.

The actual browser review covered the desktop hero, work, About, toolkit selection, and the smallest portrait menu. The first pass was refined after observing a horizon behind introductory text, image overflow beyond the hero, low-resolution mobile cropping and a small layout shift when the motion control appeared. Those issues were corrected before the final captures. The final hero image source size reflects the full height of the portrait composition, rather than just viewport width. The expedition uses the existing portrait browser capture on mobile, preserving the astronaut, dish and Earth composition.

## Verification

Final results against the production build:

| Check | Result |
| --- | --- |
| `npm run lint` | Pass, no warnings |
| `npm run typecheck` | Pass, strict TypeScript |
| `npm run build` | Pass, all portfolio routes statically generated |
| Playwright full suite | **47 passed**, approximately 1.1 minutes |
| `git diff --check` | Pass |
| Changed/new text secret-pattern scan | No matches for private keys, GitHub tokens, AWS access-key IDs or OpenAI secret-key patterns; no environment/build/dependency paths in the change set |

The browser suite includes the eight-size layout matrix, stable project URLs and source links, redirect/history behavior, empty/draft/retired catalog handling, missing media validation, no-JavaScript content, reduced motion, mobile menu and Escape, keyboard toolkit behavior, image loading and absence of 3D asset downloads on the homepage.

Existing coverage also passed for camera-relative movement, diagonal speed, collisions, relay inspection, dialog pause and focus return, touch cancellation, drag-to-look, Observe mode, jumping, map selection, orbital overview/return, context loss, failed assets and adaptive quality. The existing foundation and histories were preserved.

## Performance measurements

Raw results: [measurements.json](screenshots/portfolio/measurements.json). Chrome `158.0.8127.36`, production localhost, fresh browser contexts and disabled browser cache, warm server-side image cache. Three navigation runs per viewport. Desktop: 1440 × 900, unthrottled. Mobile: 390 × 844 Chrome emulation, 4× CPU slowdown, 1.6 Mbps download, 750 Kbps upload and 150 ms network latency.

| Median measurement | Desktop | Emulated mobile |
| --- | ---: | ---: |
| First contentful paint | 52 ms | 900 ms |
| Largest contentful paint | 52 ms | 1,372 ms |
| Cumulative layout shift | 0 | 0 |
| Initial transferred bytes | 343,822 B | 316,662 B |
| JavaScript transferred bytes | 145,525 B | 145,525 B |
| Initial requests | 18 | 18 |
| 3D model / WASM / KTX downloads | 0 | 0 |
| Four-second scroll frame interval, p95 | 16.7 ms | 16.8 ms |
| Scroll frames over 50 ms | 0 | 0 |

Scroll sampling used loaded page assets; mobile retained the 4× CPU slowdown. Approximately 60 frames per second were observed. The desktop navigation sample contained no long tasks; two mobile runs contained no long task and one contained a single 50 ms task. These are local laboratory results, not deployed network performance, physical-device measurements or field INP results.

The first-pass desktop CLS was approximately 0.017. Reserving the motion control’s layout space brought all final measured runs to zero. Increasing the mobile planetary source resolution added approximately 18 KB to initial transfer while keeping the final mobile median LCP below 1.4 seconds in this setup.

## Accessibility review

Temporary official axe-core 4.10.3 was used outside the repository; it is not a website dependency. The fully revealed homepage returned **zero automated violations** in desktop and mobile runs, with 43 and 44 passing checks respectively. Axe left image/transparency-dependent contrast for manual review on 33 desktop and 34 mobile elements; a zero-violation result does not resolve those incomplete checks automatically.

Core palette calculations:

| Text / background | Contrast |
| --- | ---: |
| Ivory / midnight | 15.96:1 |
| Slate body text / midnight | 8.56:1 |
| Copper / midnight | 10.12:1 |
| About body text / paper | 5.00:1 |
| About accent / paper | 4.99:1 |
| Weather study text / blue | 9.68:1 |
| Language study labels / ivory | 6.28:1 |

Image-backed type was visually reviewed in the actual desktop/mobile captures. Hero introduction placement and opaque action backplates protect readability; captions use dark backplates. Keyboard activation, visible focus, skip-link focus, tab selection, Escape, native mobile disclosure behavior, no-JavaScript routes and live reduced-motion changes passed automated interaction checks.

Physical iOS Safari/Android hardware and a full assistive-technology audit remain follow-up. The measured Chrome emulation is not a substitute for those reviews.

## Sources, rights and remaining content

See [content and design research](portfolio-content.md) for public primary sources, the browser reference audit, selected content, content maintenance and editorial gaps. See the [asset ledger](asset-credits.md) for source image blobs, reuse basis, generation brief, byte sizes and existing 3D asset licenses.

LinkedIn’s authentication wall prevented verification of education or employment details; none were invented. Fuller individual-contribution narratives, approved actual product captures for weather/language and the complete MEETFLIX case study remain content follow-up. No unverified email, awards, customer metrics, accreditation or production deployment claims were added.

## Reproduce

Build and serve the site, then run the ordinary checks described in the README. For captures and measurements:

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3200 \
AXE_CORE_PATH=/absolute/path/to/temporary/axe-core/axe.min.js \
PORTFOLIO_RECORD=1 node scripts/review-portfolio.mjs
```

The review script uses the existing Playwright dependency and installed Chrome on macOS. A Playwright-compatible FFmpeg executable is needed for optional recording. In this run, the installed system FFmpeg was exposed through a temporary Playwright browser-cache path. Browser tools and npm review utilities were kept outside the repository.

The script produces WebM; the curated copy was encoded as MP4 with system FFmpeg (`libx264`, CRF 23, `yuv420p`, `+faststart`, two encoder threads), and the temporary duplicate was removed. Documentation captures and measurements are intentionally kept out of public runtime assets.

## Release gate

All changes remain **uncommitted** on `codex/cinematic-portfolio`. Nothing is staged. The remote remains `https://github.com/akshat-j1/akshat-jain.me.git`. No existing work was reset or discarded. The local preview is ready for aesthetic review; merging into main and deployment require the user’s visual approval.

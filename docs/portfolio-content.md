# Cinematic portfolio content and design research

Research date: 21 November 2026. This milestone replaces the local homepage on `codex/cinematic-portfolio`, based on `513def294d55cc294c65f1b2f9a2a5c365f48608`. Production release remains subject to visual approval.

## Verified content

The primary sources were read directly through GitHub’s API and the public profile was also inspected in a browser. Repository README setup commands were treated as documentation, not instructions to execute.

| Record | Primary sources | Used on the website | Boundaries |
| --- | --- | --- | --- |
| Personal identity | [Public profile README](https://github.com/akshat-j1/akshat-j1/blob/main/README.md), plus the user’s approved description as a computer science student | Full-stack applications, practical AI experiments, playful browser tools, local vision, weather intelligence, language assessment; GitHub and LinkedIn links | No institution, employment, location, awards, résumé, email address or professional credentials inferred. Building philosophy is editorial copy grounded in the work, not a claimed qualification. |
| MEETFLIX | [README](https://github.com/akshat-j1/meetflix#readme), [asset notice](https://github.com/akshat-j1/meetflix/blob/main/public/fine/ASSET-NOTICES.md), source tree and QA frame | Chrome Manifest V3 extension; four documented visual effects; three non-exit gesture triggers; local MediaPipe processing; TypeScript/Vite; CodeDay submission v0.7.1 | Install from source. No Chrome Web Store claim, impact metric or independent live-call test claim. Existing `/work/meetflix`, stable ID, lunar relay assignment and full case-study preparation status remain intact. |
| National Weather Big Data Analytics Platform | [README](https://github.com/akshat-j1/sih26069-weather-platform#readme) and source tree | SIH26069 project; citizen report ingestion, map dashboard, operator triage, explainable scoring, FastAPI/PostGIS/Redis/React, outbox and SSE | Containerized demonstration, not a government deployment. Official IMD station feed is a stub requiring credentials; some integrations are feature gated. No real-world accuracy, usage, awards or impact numbers claimed. |
| LinguaCert AI | [README](https://github.com/akshat-j1/linguacert-ai#readme), [package manifest](https://github.com/akshat-j1/linguacert-ai/blob/main/package.json), profile project description | AI-assisted English assessment direction; reading, listening, speaking and writing; CEFR A1–C2; Next.js/TypeScript/Supabase/Gemini | Explicitly in development. No accreditation, validated scoring, independently verified complete assessment flow or finished certification service claimed. |

The public LinkedIn URL opened an authentication wall. No LinkedIn employment or education claims were used. The link itself is verified by the public GitHub profile. CentreMate was also reviewed, but the three projects highlighted in the current public profile form the curated selection for this milestone.

Source tree snapshots recorded during research:

- Profile: `378bd316699719c0aa0ae70e8ba81b2e7a6ec567`
- MEETFLIX: `189381d3b4c3d73ef60e6cb7b94b3bf0c73a0ffe`
- Weather platform: `0547a3d340697ecb26cc46cf164a9d77b8c49775`
- LinguaCert AI: `492c257d28b5cc6c7b09baeabb1502497d9a46ae`

These are Git tree IDs returned by the recursive tree API, not website commit hashes.

## Browser reference audit

The supplied websites were opened in an actual browser. Desktop and portrait layouts, scrolling, visible navigation and selected interactive states were inspected where accessible. No reference website’s code, artwork, screenshot or text was copied into this repository.

| Reference | Observed direction | Application here |
| --- | --- | --- |
| [SGX01](https://sgx-01.vercel.app/) | Layered landscape introduction, oversized identity, a persistent sense of place, dramatic section changes and a pale expanded menu | One quiet planetary arrival, large identity and a considered mobile disclosure menu. No scroll hijacking or loading curtain. |
| [Blog](https://blogs-zeta-lemon.vercel.app/) | Cream editorial composition, large dotted typography, grayscale imagery, ruled navigation and personal narrative | Personal ASCII portrait, warm paper About section and deliberate long-form project briefs. No copied title treatment or biography. |
| [Argus](https://www.argusintelligence.in/) | Strong full-screen hierarchy, restrained floating navigation, immersive light and selectable process stages | Clear section compositions and keyboard-operable toolkit tabs. No copied purple glow, company claims or UI. |
| [Active Theory](https://activetheory.net/) | Sculptural animated opening with convincing visual depth and very quiet surrounding navigation | Depth concentrated in the planetary hero, with lightweight image compositing instead of another WebGL scene. |
| [Bruno Simon](https://bruno-simon.com/) | Interactive entry observed; the complete driving experience did not become available during this audit | Retain the optional existing exploration route. No claim that the full reference journey was tested. |
| [Awwwards](https://www.awwwards.com/), [Behance](https://www.behance.net/), [ArtStation](https://www.artstation.com/) | Large visual studies, editorial pacing, strong image-to-text contrast, gallery composition | Distinct showcases rather than an identical card grid. These are inspiration galleries, not asset sources. |

## Visual system

The core composition is an orbital arrival followed by a grounded account of actual work. The massive name is the opening focal point. Planetary light stays below the introduction. The portfolio then alternates original warm MEETFLIX imagery, a blue signal-field study and an ivory language study. The personal portrait gives the page an identity that is specific to Akshat.

- Midnight `#080f1b`, ivory `#edeae2`, slate `#a4aebd`, copper `#ddb58e`; warm paper `#e9e5dc` only for the personal section.
- Existing local Instrument Serif carries identity and display type. Existing local Inter carries navigation and body copy.
- Large imagery and editorial layouts with generous spacing; small labels provide chapter and project context rather than a game HUD.
- Motion uses a single easing family, a brief opening reveal, restrained image drift and scroll parallax, one-time section reveals, image hover response and a short toolkit panel transition.
- No sound, custom cursor, heavy animation library, analytics, remote font, database, authentication or CMS introduced.
- Hero ambient motion has an explicit pause control, stops when the hero is offscreen and is disabled under reduced motion. All essential content is rendered before JavaScript.

## Content maintenance

`content/projects.ts` remains the single project catalog. Array order controls display order. `featured: true` includes a published record on the homepage; all published records remain in `/work`. Drafts stay private. Removing a record removes its homepage and index presentation; use the existing retirement/alias mechanism when preserving an old URL.

`presentation` contains optional editorial title, hook, visual treatment, caption, cover and study labels. Image covers receive the same local-media validation as screenshots. The reusable showcase never uses a project ID to choose interaction behavior. Study variants are optional visual templates; ordinary cover images work for any future project. No scene component was changed to add the new projects.

`content/profile.ts` contains biography, social links, toolkit groups and evidence project IDs. Toolkit evidence names and URLs are resolved from the published catalog on the server, so project renames and removals cannot leave stale project links there. Updating project content does not require editing world geometry or the toolkit component.

Future projects and case-study media are not prefetched. `/explore` stays behind explicit links with prefetch disabled. The Moon, relay, ferry and other scenic installations remain independent of portfolio records. No spacecraft, flight or observatory implementation was added.

A CMS would become useful if nontechnical editors need frequent publishing, review workflows or asset management. Git-managed typed content is sufficient for the present scope.

## Content still needed

A fuller account of individual contribution and implementation decisions for each project, approved real product captures for the weather and language projects, and final MEETFLIX case-study material remain editorial follow-up. The current briefs state verified capabilities and limitations instead of inventing that missing material.

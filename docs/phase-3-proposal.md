# Phase 3 proposal · An expandable space portfolio

**Status:** Architecture approved. Milestone 1 is implemented locally for review. Milestone 2 awaits separate approval. The proposed first journey connects the lunar surface to an orbital observatory. Either place can stand on its own with zero featured projects.

## Starting point at the foundation checkpoint

At checkpoint `43d93162`, one named export held MEETFLIX and its relay location together. The work index, project page and exploration shell imported it directly, and the scene reported proximity as a boolean. Milestone 1 replaces those dependencies with catalog records and world-owned discovery points.

## What an editor owns

| Source | Proposed fields and responsibilities |
| --- | --- |
| Project catalog in `content/projects.ts` | One ordered collection of typed records. Each has a stable ID, public URL slug, display name, editorial visibility and entry state (in preparation, brief or case study). Optional fields include verified summary, project lifecycle status, technologies, credited local screenshots with alt text, labeled links, case-study content or a reference to a separately loaded long entry, former URL slugs and discovery assignments. Catalog order determines the work index order. |
| World definitions | A small typed list of destinations and their installations. A destination has a stable ID, name, travel connections, arrival pose and scene or scene preset. Each installation has a stable local ID, physical placement, interaction radius and optional scenic action. Each destination also offers an arrival point where a whole world can feature a project. World definitions own the ship, relay, telescope, terrain, collisions and camera poses. |
| Optional assignments on the project record | Each assignment names a destination and optionally an installation within it. A project can appear in several places. For the first release each interaction point features at most one published project. Adjacent instruments can feature different projects. The reverse lookup is derived once from the catalog. Editors maintain the relationship in one place. |

For the initial migration, the public entry keeps the name **MEETFLIX**, the URL `/work/meetflix` and the “in preparation” label. Its assignment points to the Moon’s communications relay. “Station 01” and “Communications relay” move to the world definition. A separate lifecycle status can be omitted when the project’s status is unknown. The portfolio entry’s readiness only describes the material available to read.

## Editing the Milestone 1 implementation

Edit the ordered `projects` array in [content/projects.ts](../content/projects.ts). The [record schema and validator](../content/catalog.ts) define supported fields. Keep `id` and `slug` when changing display names. If a URL changes, add its previous slug to `aliases`. To withdraw an entry and preserve its URL, remove it from the array and add its slug (and any former aliases) to `retired`, optionally naming a published successor by ID. Drafts reserve their slugs and are omitted from public pages and discovery bindings. Their source text is visible to anyone who can read the Git repository.

Use `assignments: [{ destination: "moon", installation: "relay" }]` for the communications relay, `[{ destination: "moon" }]` for the lunar landing site, or omit assignments for a work-only entry. Add multiple assignments to show the same entry in multiple locations. A vacant point loses its project prompt. The geometry, collisions, Observe mode and walking controls continue independently. New places register their own points in the [world definitions](../content/worlds.ts).

Screenshots reference local files under `public/` with root-relative URLs, width, height and alt text. Credit images and record reuse rights in the asset ledger when adding art. The server validates content when loading the catalog, including during the production build. The exploration client receives only the active destination’s short discovery records. Long text and screenshot URLs stay on the project page.

## Milestone 1 review evidence

The published catalog contains MEETFLIX at its original URL and relay assignment. In an isolated local copy, a browser opened a new work-only entry with a screenshot, technologies, an external link and case-study text. The same record then moved to the top of the index under a new display name. Its URL stayed stable and a former slug redirected to it. Walking from the landing site to the relay opened MEETFLIX at the former and the replacement project at the latter. No fixture screenshot was requested during exploration.

The walkthrough also covered a single entry at multiple points, retirement to a successor, removal of every project, continued walking and Observe mode, and the absence of inspect prompts in the empty world. A separate production build of the empty index returned HTTP 308 from a retired URL to `/work` and HTTP 404 for an unknown slug. Keyboard, mouse, emulated touch, reduced motion, WebGL fallback and adaptive rendering are covered by the production browser suite. Physical mobile testing remains part of the later travel milestone.

## What changes when the portfolio changes

| Editorial action | Change to make | Visitor experience |
| --- | --- | --- |
| Add or update a project | Add or edit a record and its approved media. Assign a location only if desired. | A published project appears in the direct index. Existing assigned locations show its current title, summary and link. |
| Rename or reorder | Edit the display name or move the record in the list. Keep its ID and slug. For a deliberate URL change, record the former slug as an alias. | Bookmarks survive a rename. Old slugs redirect to the canonical entry. Reordering leaves the physical layout intact. |
| Move a project or feature a replacement | Edit the assignments on the affected records. Give a distinct replacement its own ID and URL. | The existing instrument shows the new selection. The original project's URL continues to describe the original work while it is published. |
| Withdraw or delete | Unpublish or remove the record. For a deliberately retired public URL, retain a small redirect entry to the index or an explicitly designated successor. | Work listings, project prompts and return links are derived from published records. The location keeps its scenic action or becomes scenery. Unknown URLs offer a real 404 with a Portfolio link. |
| Change the scale of an experience | Move the assignment from an instrument to a destination arrival point, or choose another existing preset. | The same project URL works for a small installation or a dedicated world. A genuinely new landscape or instrument behavior is a separate art or engineering change. |

Validate IDs, canonical slugs, aliases and redirects for conflicts and cycles. Check published assignments against world IDs, reject competing occupants, and check local media and alt text. Runtime lookup treats an unavailable record as an unassigned location. An empty catalog still leaves an explorable Moon and a usable portfolio index. Fixture records for these cases belong in tests and stay out of the published catalog.

## How visitors discover and travel

The Moon remains the starting place. A survey craft just beyond the eastern crater rim gives the walk a distant landmark. Boarding offers a short, skippable view of the dish receding below the cabin window. In orbit, a telescope frames the same crater. Seeing the landing site from both scales gives the journey a purpose even when the telescope has no project assigned.

A small Destinations menu lists available places independently of project publication. Visitors can travel directly, return to the Moon at their previous pose or open Portfolio at any time. A project’s HTML page can link to its assigned places. A project with several appearances can list them by location. A project with no assignments needs only its own URL. Direct visits to a world use a safe arrival pose. Reduced motion offers immediate arrival.

## Rendering and navigation

- Replace the dedicated work-page implementation with a data-driven App Router route at `/work/[slug]`, retaining the existing public URL. Generate the index, metadata, project entries and redirects from the catalog. Keep case studies and project navigation accessible through ordinary server-rendered HTML links.
- Have proximity, pointer taps and keyboard inspection resolve the same installation ID. Resolve its available actions in one place. A scenic action such as looking through a telescope can coexist with an optional project entry. Show each action only when it has a target. Reuse the native dialog, focus return, Escape handling and touch controls. Use the resolved target for the HUD and any instruction text as well as for the dialog.
- Keep one exploration canvas while traveling. Load the selected scene or preset by destination ID. Pause movement during travel, remember the last safe lunar pose, clear held input, and restore focus at arrival. Browser Back, cancellation and asset failure should leave the visitor at a usable place with direct project navigation.
- Pass only the current world’s short published project summaries to its shell. Load case-study bodies and full screenshots on their project routes. Load planetary geometry and textures on destination selection. Release the outgoing scene’s resources and ignore stale results from cancelled travel. Preserve adaptive quality and idle rendering.

## Art and performance review

Build the surface departure, reverse approach, cabin framing and telescope view around one recognizable crater silhouette, a consistent sun direction and a clear sense of scale. Review the eastern plain and southeastern peaks as part of the walk in both directions. Inspect each setting with its project assignment removed. The place should still be worth visiting.

Measure against the accepted Moon build on the same hardware and settings. Its M4 desktop baseline was 16.8 ms at the 95th percentile, with 2.42 MB of exploration assets and zero exploration requests on the landing page. Check that adding a fixture project or an unvisited planet causes zero additional model, texture or screenshot downloads on Moon entry. Measure peak memory and frame intervals across repeated round trips. Use physical iOS Safari and Android Chrome as well as emulated portrait before mobile acceptance.

## Proposed milestones

1. **Prove the editorial model on the existing Moon.** Migrate MEETFLIX and its route, then exercise adding, renaming, reordering, moving, replacing, unpublishing and deleting fixture projects. Verify zero projects, a scenic relay, slug redirects, direct access without WebGL, keyboard focus and touch inspection. Acceptance requires completing these edits through data and assets alone.
2. **Approve the journey visually.** Block out the eastern approach, reverse view, spacecraft window and orbital telescope. Review desktop and portrait views from the walk and the return journey, both with and without featured projects.
3. **Connect the two places.** Prove direct entry to each world, skippable travel, Back, reduced motion, return pose and recovery after failed or interrupted travel. Reassign a fixture project from the relay to the observatory and verify both worlds and the same direct work URL.
4. **Finish and profile one round trip.** Refine the spacecraft and observatory, review the entire trip in motion, profile physical phones, compare resource use and rerun the existing regressions. Additional projects can use these locations immediately. New destination art can follow when a project warrants it.

Typed, version-controlled content fits the current edit-and-review workflow. Routine edits would ship through the normal site build. A CMS becomes worthwhile if browser editing for multiple contributors, scheduled publication or content updates independent of code releases become frequent needs. A future CMS could supply the same validated records while scene components keep their existing inputs.

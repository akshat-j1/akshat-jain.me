# Lunar Field Log

- Follow the scope in [docs/roadmap.md](docs/roadmap.md). The current deliverable is the cinematic personal portfolio homepage. Preserve /explore, /work and stable project URLs. Archive the original coming-soon page at /coming-soon; /experience redirects to /. Release requires visual approval.
- Keep the App Router and strict TypeScript. Portfolio content and navigation must work with ordinary HTML links and without WebGL.
- Keep input, simulation, camera, rendering, and interface responsibilities separate. Use refs for per-frame data and reserve React state for visible state changes.
- Keep artwork local. Verify reuse rights and update the asset ledger before adding external assets.
- Use verified portfolio facts. Track missing information in development docs.
- Run lint, type checks, a production build, and the browser tests after changing the relevant systems.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

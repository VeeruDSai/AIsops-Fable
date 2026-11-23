# Walking Skeleton — StoryForge AI

**Phase:** 1
**Generated:** 2026-11-24

## Capability Proven End-to-End

A client can send an HTTP POST request to `/api/generate` with an optional premise and receive an immediate real-time progressive stream of generated story text powered by Gemini 2.5 Flash, executing on a Node.js serverless route with zero client-side API key exposure.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16 (App Router) | Native Node.js Serverless Route Handlers, Web Standard `ReadableStream`, React 19 compatibility, zero-cost Vercel deployment |
| AI SDK | `@google/genai` (^3.6.1) | Official modern unified Google Gen AI SDK; native async generator streaming (`generateContentStream`), direct support for `gemini-2.5-flash` |
| Streaming Protocol | Web `ReadableStream` over HTTP POST | Native browser and server standard; chunked transfer encoding without WebSocket or SSE infrastructure overhead |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`, `@tailwindcss/typography`) | CSS-first configuration, zero JS config file, built-in prose formatting for story rendering |
| Testing Harness | Vitest (^5.1.1) | Fast native TypeScript execution and route handler mocking with zero SWC/Babel configuration |
| Data Layer | Ephemeral / In-Memory (No Database) | Free-tier zero-cost architecture; no persistent accounts or databases needed for v1 |
| Key Security | Server Environment (`process.env.GEMINI_API_KEY`) | Loaded exclusively on server; `.env*.local` gitignored, zero `NEXT_PUBLIC_` leakage |
| Runtime Target | Node.js Serverless (`runtime = 'nodejs'`) | Full Node core module compatibility (`node:stream`, `node:crypto`); avoids Edge isolate incompatibilities |

## Stack Touched in Phase 1

- [ ] Project scaffold (framework, build, lint, test runner)
- [ ] Routing — at least one real route (`/api/generate`)
- [ ] Database — N/A (ephemeral in-memory architecture by design)
- [ ] UI — baseline shell (`src/app/page.tsx`, `layout.tsx`)
- [ ] Deployment — local full-stack run verified via Next dev server and automated Vitest suite

## Out of Scope (Deferred to Later Slices)

- Multi-character form inputs and dynamic UI builder (deferred to Phase 3)
- 8-genre selector badge controls (deferred to Phase 3)
- Classical 4-part narrative prompt template engine with fallback inference (deferred to Phase 2)
- Formatted typographic reader canvas and clipboard copy feedback (deferred to Phase 4)
- "Surprise Me" randomized generator and regeneration cooldown controls (deferred to Phase 5)
- User accounts, persistent cloud database, authentication (deferred to v2 / out of scope)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: Narrative Prompt Engine & Intelligent Fallback Generation (classical 4-part story structure and automatic character/genre synthesis)
- Phase 3: Story Configuration & Character Builder (interactive character forms, 8 genre chips, premise textarea)
- Phase 4: Story Reader Canvas & Clipboard Controls (typographic reading view with markdown rendering and one-click copy)
- Phase 5: Story Regeneration, Surprise Mode & Production Deployment (Surprise Me mode, rate-limiting cooldowns, live Vercel deployment)

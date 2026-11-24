# AIsop's Fables

## What This Is

AIsop's Fables is a beginner-friendly web application powered by Generative AI that creates rich, engaging stories on demand. Users can define characters, select genres, and provide premise descriptions, or let the AI intelligently invent missing details and craft unexpected tales with a dedicated "Surprise Me" mode.

## Core Value

Generate creative, coherent, and well-structured stories with beginning, middle, climax, and conclusion—even when given minimal or no user input—delivering real-time streaming feedback and seamless regeneration.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Users can enter multiple characters with their names and optional roles/descriptions
- [ ] Users can optionally select a story genre (Fantasy, Horror, Romance, Mystery, Sci-Fi, Adventure, Comedy, Thriller)
- [ ] Users can optionally provide a premise or short plot description
- [ ] Intelligent fallback: generates coherent stories even if some or all inputs are omitted
- [ ] Dedicated "Surprise Me" button to generate completely randomized, creative stories independently of the form
- [ ] Structured story output featuring a title, beginning, middle, climax, and conclusion
- [ ] Real-time streaming generation displaying paragraphs as they are produced by Gemini
- [ ] Copy story to clipboard functionality
- [ ] Story regeneration capability with one click
- [ ] Clean, accessible, responsive UI styled with Tailwind CSS
- [ ] Server-side Gemini API route using `@google/genai` SDK and secure environment variables
- [ ] Deployment-ready for Vercel free tier

### Out of Scope

- User authentication / user accounts — not needed for v1, keeps architecture simple
- Database storage / persistent story history — stories are ephemeral in v1 to stay entirely free-tier and zero-maintenance
- Paid AI APIs or external subscriptions — strict reliance on Google Gemini free tier
- Audio narration / Text-to-Speech (TTS) — deferred to keep initial scope manageable for a beginner
- AI image generation for story covers — deferred to post-v1

## Context

- The developer has no prior project-building experience; the architecture must remain simple, approachable, and educational.
- Built as a modern Next.js (App Router) project with React, TypeScript, and Tailwind CSS.
- Integrates with the official Google Gemini API via `@google/genai` SDK.
- Hosted on Vercel with zero-cost deployment and GitHub version control.

## Constraints

- **Free Tier Only**: Strict zero-cost constraint across hosting (Vercel) and AI services (Gemini free tier).
- **No Database / Auth**: Ephemeral in-memory/client state only for v1.
- **API Key Security**: `GEMINI_API_KEY` stored securely in server environment variables (`.env.local` / Vercel secrets), never exposed to client-side bundles.
- **Architectural Simplicity**: Minimal third-party dependencies, clear modular code structure, and well-explained concepts.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js App Router | Offers server-side API routes to protect the Gemini API key while providing React frontend in one unified repository | — Pending |
| `@google/genai` SDK | Official, modern Google Gen AI SDK for Node/TypeScript | — Pending |
| Streaming Generation | Delivers immediate feedback and engaging user experience while reducing perceived latency | — Pending |
| Dynamic Character List | Gives users flexibility to add/remove characters with name and optional role | — Pending |
| Server-side Env Var for API Key | Standard, secure practice that keeps API keys out of client browser bundles | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-11-24 after initialization*

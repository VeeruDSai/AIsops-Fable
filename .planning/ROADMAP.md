# Roadmap: StoryForge AI

## Overview

StoryForge AI is an interactive, zero-cost story generation web application powered by Next.js and Google Gemini. The journey takes the project from a secure serverless streaming backend and adaptive prompt engine, through dynamic character and story configuration controls, to a polished typographic reader canvas and production deployment on Vercel's free tier. Every phase delivers a functional, verifiable capability designed to provide immediate streaming feedback and eliminate writer's block with zero login or paywall friction.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Serverless Streaming Route** - Secure serverless Gemini streaming route handler with anti-buffering headers and rate-limit handling
- [x] **Phase 2: Narrative Prompt Engine & Intelligent Fallback Generation** - Classical 4-part story generation with automatic fallback inference for partial or empty inputs
- [ ] **Phase 3: Story Configuration & Character Builder** - Interactive character management, 8-genre selector, and premise input controls
- [ ] **Phase 4: Story Reader Canvas & Clipboard Controls** - Typographic story reader canvas with real-time Markdown rendering and one-click copy feedback
- [ ] **Phase 5: Story Regeneration, Surprise Mode & Production Deployment** - Dedicated Surprise Me mode, one-click regeneration with cooldowns, and live Vercel free-tier deployment

## Phase Details

### Phase 1: Foundation & Serverless Streaming Route
**Goal**: Establish serverless Gemini streaming backend pipeline with security and rate-limiting controls
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: TECH-01, TECH-02
**Success Criteria** (what must be TRUE):
  1. Serverless route handler at `/api/generate` accepts requests and streams text chunks from Gemini without exposing `GEMINI_API_KEY` in client bundles
  2. Server streaming uses standard Node.js runtime with explicit anti-buffering headers (`X-Accel-Buffering: no`, `Cache-Control: no-cache, no-transform`)
  3. API quota exhaustion and rate limit errors (429) are trapped and return clear, descriptive error responses
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Next.js 16 project scaffolding, Tailwind CSS v4 styling, environment security, and Vitest test harness
- [x] 01-02-PLAN.md — Serverless Gemini streaming route handler with anti-buffering headers, rate-limit trapping, and automated tests

### Phase 2: Narrative Prompt Engine & Intelligent Fallback Generation
**Goal**: Generate structured 4-part classical stories with automatic fallback inference for partial or empty inputs
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: GENR-01, GENR-03, GENR-04
**Success Criteria** (what must be TRUE):
  1. System generates a complete, coherent story even when provided with partial or completely empty inputs by intelligently synthesizing missing characters, genre, or premise
  2. Generated stories strictly follow a 4-part classical narrative structure featuring a title, beginning, middle, climax, and conclusion
  3. System streams story text progressively in real time as chunks arrive from the Gemini API
**Plans**: 1 plan

Plans:
- [x] 02-01-PLAN.md — Narrative prompt engine, intelligent fallback inference, 4-part structure, and API route wiring

### Phase 3: Story Configuration & Character Builder
**Goal**: Allow users to configure characters, genres, and premises through responsive form components
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: INPT-01, INPT-02, INPT-03
**Success Criteria** (what must be TRUE):
  1. User can dynamically add, edit, and remove multiple characters with custom names and optional roles or traits
  2. User can select a genre from 8 curated genre badges (Fantasy, Sci-Fi, Horror, Romance, Mystery, Adventure, Comedy, Thriller) with active visual selection state
  3. User can input an optional story premise or plot seed in an accessible, styled text area
**Plans**: 1 plan
**UI hint**: yes

Plans:
- [x] 03-01-PLAN.md — Character builder, 8-genre selector, premise input, and streaming generation form

### Phase 4: Story Reader Canvas & Clipboard Controls
**Goal**: Display streamed stories in a responsive reader canvas with formatted typography and one-click copy
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: DISP-01, DISP-02
**Success Criteria** (what must be TRUE):
  1. Story displays in a clean, responsive reader canvas with formatted book-like typography and distinct narrative stage headings
  2. User can copy the full story text to clipboard with a single click
  3. User sees instant visual confirmation (e.g. "Copied!") upon copying that reverts automatically after a brief delay
**Plans**: TBD
**UI hint**: yes

### Phase 5: Story Regeneration, Surprise Mode & Production Deployment
**Goal**: Deliver one-click randomized story generation, regeneration with rate-limiting cooldowns, and zero-cost Vercel deployment
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: GENR-02, DISP-03, TECH-03
**Success Criteria** (what must be TRUE):
  1. User can click a dedicated "Surprise Me" button to immediately trigger a completely randomized story generation without filling in form inputs
  2. User can regenerate a story with a single click using current or updated parameters, with buttons disabled during generation to prevent quota burn
  3. Application builds cleanly with zero errors and deploys to Vercel free tier with streaming functionality verified in production
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Serverless Streaming Route | 2/2 | Complete | 2026-11-24 |
| 2. Narrative Prompt Engine & Intelligent Fallback Generation | 1/1 | Complete | 2026-11-24 |
| 3. Story Configuration & Character Builder | 1/1 | Verification pending | - |
| 4. Story Reader Canvas & Clipboard Controls | 0/TBD | Not started | - |
| 5. Story Regeneration, Surprise Mode & Production Deployment | 0/TBD | Not started | - |

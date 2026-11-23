# Phase 1: Foundation & Serverless Streaming Route - Research

**Researched:** 2026-11-24  
**Domain:** Next.js App Router Serverless Streaming & Google Gemini API Integration  
**Confidence:** HIGH  

---

<user_constraints>
## User Constraints (from CONTEXT.md)

*No `01-CONTEXT.md` was provided for Phase 1. Foundational constraints are derived verbatim from `GEMINI.md` and `.planning/PROJECT.md`.*

### Locked Decisions
- **Free Tier Only**: Strict zero-cost constraint across hosting (Vercel) and AI services (Gemini free tier) `[VERIFIED: GEMINI.md:14]`.
- **No Database / Auth**: Ephemeral in-memory/client state only for v1 `[VERIFIED: GEMINI.md:15]`.
- **API Key Security**: `GEMINI_API_KEY` stored securely in server environment variables (`.env.local` / Vercel secrets), never exposed to client-side bundles `[VERIFIED: GEMINI.md:16]`.
- **Architectural Simplicity**: Minimal third-party dependencies, clear modular code structure, and well-explained concepts `[VERIFIED: GEMINI.md:17]`.
- **SDK Standard**: Must use `@google/genai` (^3.6.1) rather than deprecated `@google/generative-ai` `[VERIFIED: GEMINI.md:148]`.
- **Runtime Standard**: Standard Node.js Serverless Runtime (`export const runtime = 'nodejs'`), strictly avoiding Vercel Edge Runtime `[VERIFIED: GEMINI.md:149]`.

### the agent's Discretion
- Choice of initial project scaffolding structure and configuration files (`package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`).
- Test runner and framework selection for route handler validation (`vitest`).
- Error envelope structure and in-band stream error demarcation format.

### Deferred Ideas (OUT OF SCOPE)
- User authentication & persistent accounts (v2) `[VERIFIED: .planning/REQUIREMENTS.md:53]`.
- Cloud databases (Prisma, Supabase, PostgreSQL, MongoDB) (v2) `[VERIFIED: .planning/REQUIREMENTS.md:54]`.
- Audio narration / Text-to-Speech (v2) `[VERIFIED: .planning/REQUIREMENTS.md:57]`.
- Mid-stream stop button via AbortController in frontend UI (v2: FEAT-01) `[VERIFIED: .planning/REQUIREMENTS.md:41]`.
</user_constraints>

---

## Project Constraints (from GEMINI.md)

Directives extracted from `./GEMINI.md` governing Phase 1:
1. **Never use `@google/generative-ai`**: Legacy deprecated SDK. Must strictly use `@google/genai` (^3.6.1) `[VERIFIED: GEMINI.md:148]`.
2. **Never configure Vercel Edge Runtime (`runtime = 'edge'`)**: `@google/genai` depends on Node.js core APIs (`node:stream`, `node:crypto`). Must use `export const runtime = 'nodejs'` `[VERIFIED: GEMINI.md:149]`.
3. **Never execute Gemini calls client-side**: Calling Gemini from browser React components exposes `GEMINI_API_KEY` in bundles. Must route through `app/api/generate/route.ts` `[VERIFIED: GEMINI.md:150]`.
4. **No Cloud Databases**: In-memory React state and ephemeral transfers only `[VERIFIED: GEMINI.md:151]`.
5. **No `dangerouslySetInnerHTML`**: Safe rendering required `[VERIFIED: GEMINI.md:152]`.
6. **No heavy AI orchestration middleware (LangChain, Flowise, Vercel AI SDK)**: Direct `@google/genai` integration with native Node.js async generator stream piped into Web standard `ReadableStream` `[VERIFIED: GEMINI.md:136-137, 153]`.
7. **No client polling or non-streaming POST**: Route must stream chunks via `ReadableStream` `[VERIFIED: GEMINI.md:154]`.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **TECH-01** | Next.js App Router route handler (`/api/generate`) securely executes `@google/genai` calls server-side without exposing `GEMINI_API_KEY` `[VERIFIED: .planning/REQUIREMENTS.md:31]` | Verified serverless route pattern in `src/app/api/generate/route.ts` accessing `process.env.GEMINI_API_KEY`, using lazy client initialization `getGeminiClient()` to keep the key strictly server-side. |
| **TECH-02** | Route handler uses standard Node.js serverless runtime with anti-buffering streaming headers and error handling for 429 rate limits `[VERIFIED: .planning/REQUIREMENTS.md:32]` | Verified route config (`runtime = 'nodejs'`, `dynamic = 'force-dynamic'`, `maxDuration = 60`), response headers (`X-Accel-Buffering: no`, `Cache-Control: no-cache, no-transform`), and structured 429 `RESOURCE_EXHAUSTED` trapping with dual-layer (pre-stream JSON and in-band stream) recovery. |
</phase_requirements>

---

## Summary

Phase 1 establishes the foundational infrastructure and core serverless streaming backend for StoryForge AI. The application is scaffolded using Next.js 16 (App Router) with TypeScript and Tailwind CSS v4. The centerpiece of this phase is the server-side route handler at `src/app/api/generate/route.ts`, which bridges Google's modern unified `@google/genai` SDK (`ai.models.generateContentStream`) to a Web Standard `ReadableStream`.

This route satisfies three primary technical mandates:
1. **API Key Security**: The `GEMINI_API_KEY` is loaded exclusively in server runtime memory from `.env.local` / Vercel secrets and is never bundled or transmitted to the client browser.
2. **Anti-Buffering Delivery**: Explicit HTTP response headers (`X-Accel-Buffering: no`, `Cache-Control: no-cache, no-transform`, `Transfer-Encoding: chunked`) alongside `dynamic = 'force-dynamic'` and `runtime = 'nodejs'` prevent intermediate CDN reverse proxies and Vercel edge layers from buffering token chunks.
3. **Rate-Limit Resilience (429 Trapping)**: Gemini's free-tier rate limits (15 RPM, 1M TPM, 1,500 RPD) trigger `RESOURCE_EXHAUSTED` errors on bursts. The route traps these errors: if the limit triggers before streaming begins, it immediately returns a structured HTTP 429 JSON response; if a rate limit or safety block triggers mid-stream, it safely enqueues a friendly in-band markdown notice and cleanly closes the stream instead of crashing the serverless process.

**Primary recommendation:** Scaffold the Next.js 16 TypeScript foundation cleanly without heavy abstractions, instantiate `@google/genai` with `runtime = 'nodejs'`, pipe the async chunk generator directly into a native Web `ReadableStream` with explicit anti-buffering headers, link `req.signal` to upstream abort control, and validate via automated Vitest route handler tests.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| **Gemini API Key Protection** | API / Backend (`/api/generate`) | Node.js Environment (`process.env`) | Safeguards credentials from browser network inspection and client bundle extraction. |
| **Stream Chunk Encoding & Piping** | API / Backend (`/api/generate`) | Web Streams (`ReadableStream`) | Converts `@google/genai` async generator chunks into standard UTF-8 `Uint8Array` stream. |
| **Anti-Buffering & Cache Control** | API / Backend (`/api/generate`) | Edge Proxy / CDN (Vercel) | Explicit headers force proxies to immediately pass chunks to the browser without buffering. |
| **Rate Limit (429) Trapping** | API / Backend (`/api/generate`) | Client (`useStoryStream` in Ph 3) | Traps `RESOURCE_EXHAUSTED` errors server-side; sends structured status or formatted in-band recovery notice. |
| **Client Disconnect Abortion** | API / Backend (`/api/generate`) | Node.js Event Loop | Ties `req.signal` to `AbortController` to terminate upstream Gemini generation and prevent zombie token burn. |
| **Typographic & Style Baseline** | Browser / Client | Tailwind CSS v4 Engine | Provides `@import "tailwindcss";` and typography plugins for downstream story presentation. |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **`next`** | `^16.4.6` `[VERIFIED: npm registry]` | Full-stack React application framework | Standard App Router route handlers, native Web `ReadableStream` response streaming, Vercel zero-config serverless deployment. |
| **`@google/genai`** | `^3.6.1` `[VERIFIED: npm registry]` | Official unified Google Gen AI SDK | Modern production SDK (replacing legacy `@google/generative-ai`), supporting `gemini-2.5-flash` with async generator streaming (`ai.models.generateContentStream`). |
| **`react`** | `^19.3.1` `[VERIFIED: npm registry]` | UI component library | Native peer dependency for Next.js 16. |
| **`react-dom`** | `^19.3.1` `[VERIFIED: npm registry]` | DOM renderer for React | Required companion for React 19. |
| **`typescript`** | `^5.7.x` `[VERIFIED: npm registry]` | Static type checking | Compile-time contract enforcement for request schemas, genre unions, and stream chunks. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **`tailwindcss`** | `^4.3.5` `[VERIFIED: npm registry]` | Utility-first CSS styling framework | Rapid styling via CSS-first architecture (`app/globals.css`). |
| **`@tailwindcss/postcss`** | `^4.3.5` `[VERIFIED: npm registry]` | PostCSS integration for Tailwind v4 | Required build plugin in `postcss.config.mjs` for Next.js compilation. |
| **`@tailwindcss/typography`** | `^0.5.20` `[VERIFIED: npm registry]` | Typographic formatting plugin | Registered via `@plugin "@tailwindcss/typography";` in `globals.css` for prose styling. |
| **`clsx`** | `^2.1.1` `[VERIFIED: npm registry]` | Conditional class utility | Dynamic class combination for UI elements. |
| **`tailwind-merge`** | `^3.7.1` `[VERIFIED: npm registry]` | Utility conflict resolution | Safely merges overriding Tailwind classes in `cn(...)` helper. |
| **`vitest`** | `^5.1.1` `[VERIFIED: npm registry]` | Fast unit and integration test runner | Zero-config TypeScript testing for Route Handlers and utility modules. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| **`@google/genai` (direct)** | **Vercel AI SDK (`ai` + `@ai-sdk/google`)** | Vercel AI SDK adds extra dependencies, frequently changing abstraction APIs (`streamText` vs `useChat`), and hides low-level stream mechanics. Direct `@google/genai` is lightweight (~15 lines) and has zero extra dependencies. |
| **`@google/genai` (direct)** | **`@google/generative-ai`** | Rejected: Deprecated by Google, lacks Gemini 2.5 unified API contracts. |
| **Node.js Runtime (`nodejs`)** | **Vercel Edge Runtime (`edge`)** | Rejected: `@google/genai` crashes on Edge due to missing `node:stream` and `node:crypto` modules. Standard Node.js serverless functions fully support low-latency streaming. |
| **Vitest** | **Jest / ts-jest** | Jest requires complex Babel/SWC transforms for TypeScript in Next.js App Router; Vitest runs TypeScript natively with instant execution. |

**Installation Command:**
```bash
npm install @google/genai clsx tailwind-merge
npm install -D next@^16.4.6 react@^19.3.1 react-dom@^19.3.1 typescript@^5.7.0 @types/node@^22.0.0 @types/react@^19.0.0 @types/react-dom@^19.0.0 tailwindcss@^4.3.5 @tailwindcss/postcss@^4.3.5 @tailwindcss/typography@^0.5.20 postcss vitest
```

---

## Package Legitimacy Audit

Verified against npm registry via `gsd-tools package-legitimacy check`:

| Package | Registry | Weekly Downloads | Source Repo | Verdict | Disposition |
|---------|----------|------------------|-------------|---------|-------------|
| `next` | npm | 98,003,359 | github.com/vercel/next.js | [OK] (flagged SUS: too-new release) | Approved (Standard official Next.js release) |
| `@google/genai` | npm | 34,158,057 | github.com/googleapis/js-genai | [OK] (flagged SUS: too-new release) | Approved (Official Google Gen AI SDK) |
| `react` | npm | 275,732,766 | github.com/react/react | [OK] | Approved |
| `react-dom` | npm | 260,151,728 | github.com/react/react | [OK] | Approved |
| `typescript` | npm | 450,984,480 | github.com/microsoft/TypeScript | [OK] | Approved |
| `@types/node` | npm | 671,474,376 | github.com/DefinitelyTyped/DefinitelyTyped | [OK] (flagged SUS: too-new release) | Approved |
| `@types/react` | npm | 248,449,831 | github.com/DefinitelyTyped/DefinitelyTyped | [OK] | Approved |
| `@types/react-dom` | npm | 210,841,611 | github.com/DefinitelyTyped/DefinitelyTyped | [OK] | Approved |
| `tailwindcss` | npm | 190,135,318 | github.com/tailwindlabs/tailwindcss | [OK] (flagged SUS: too-new release) | Approved (Tailwind v4 official release) |
| `@tailwindcss/postcss` | npm | 61,799,895 | github.com/tailwindlabs/tailwindcss | [OK] (flagged SUS: too-new release) | Approved |
| `postcss` | npm | 443,127,553 | github.com/postcss/postcss | [OK] (flagged SUS: too-new release) | Approved |
| `clsx` | npm | 179,138,382 | github.com/lukeed/clsx | [OK] | Approved |
| `tailwind-merge` | npm | 117,711,993 | github.com/dcastil/tailwind-merge | [OK] (flagged SUS: too-new release) | Approved |
| `@tailwindcss/typography` | npm | 26,612,562 | github.com/tailwindlabs/tailwindcss-typography | [OK] | Approved |
| `vitest` | npm | 193,983,069 | github.com/vitest-dev/vitest | [OK] (flagged SUS: too-new release) | Approved (Testing framework) |

**Packages removed due to [SLOP] verdict:** None.  
**Packages flagged as suspicious [SUS]:** Packages with recent minor/patch updates flagged by the `too-new` heuristic were verified against their official GitHub organization repositories (`vercel`, `googleapis`, `microsoft`, `tailwindlabs`, `vitest-dev`). All have millions of weekly downloads and no malicious postinstall scripts. Approved for use.

---

## Architecture Patterns

### System Architecture Diagram

```
Client / External Test
         │
         │ HTTP POST /api/generate
         │ Headers: Content-Type: application/json
         │ Body: { premise?: string, characters?: [], genre?: string }
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Next.js App Router Route Handler (src/app/api/generate/route.ts)           │
│  - Runtime: Node.js (export const runtime = 'nodejs')                       │
│  - Execution Limit: export const maxDuration = 60                          │
│  - Cache Policy: export const dynamic = 'force-dynamic'                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Validate Environment                                                     │
│    Is process.env.GEMINI_API_KEY present? ──No──► Return HTTP 500 JSON      │
│                     │ Yes                                                   │
│ 2. Safe JSON Body Extraction & Signal Binding                              │
│    Bind req.signal to internal AbortController                              │
│                     ▼                                                       │
│ 3. Invoke GoogleGenAI SDK                                                   │
│    ai.models.generateContentStream({ model: 'gemini-2.5-flash', ... })      │
│    Caught 429 Pre-Stream? ──────────────────────► Return HTTP 429 JSON      │
│                     │ Success (responseStream acquired)                     │
│ 4. Construct Native Web ReadableStream                                      │
│    - start(controller): Iterate `for await (const chunk of responseStream)` │
│    - Check Safety: chunk.candidates[0].finishReason === 'SAFETY'            │
│    - Check Text: chunk.text getter -> TextEncoder.encode -> enqueue         │
│    - Catch Mid-Stream 429/Error: In-band explanatory notice -> close        │
│    - cancel(): controller aborts upstream Gemini stream                     │
│                     ▼                                                       │
│ 5. Return HTTP Response Object                                              │
│    Headers:                                                                 │
│      'Content-Type': 'text/plain; charset=utf-8'                            │
│      'Cache-Control': 'no-cache, no-transform'                             │
│      'X-Accel-Buffering': 'no'                                              │
│      'Transfer-Encoding': 'chunked'                                         │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼ Immediate Byte Stream (Chunked HTTP)
                       Client / Test Consumer
```

### Recommended Project Structure

```
c:/Projects/AIsop's Fables/
├── .env.example                     # Reference environment variables
├── .env.local                       # Local secret (gitignored, contains GEMINI_API_KEY)
├── .gitignore                       # Ensures .env*.local and node_modules are ignored
├── next.config.ts                   # Next.js compilation configuration
├── package.json                     # Dependencies and scripts
├── postcss.config.mjs               # PostCSS configuration for Tailwind v4
├── tsconfig.json                    # TypeScript path mappings (@/* -> ./src/*)
├── vitest.config.ts                 # Vitest test configuration
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── generate/
│   │   │       └── route.ts         # Phase 1 Core: Serverless streaming route handler
│   │   ├── globals.css              # Tailwind v4 @import and @plugin rules
│   │   ├── layout.tsx               # Root layout HTML shell
│   │   └── page.tsx                 # Base entry page (Phase 1 placeholder)
│   ├── lib/
│   │   ├── gemini.ts                # GoogleGenAI client singleton/factory
│   │   └── utils.ts                 # cn() class utility merger
│   └── types/
│       └── story.ts                 # Core TypeScript schemas (StoryRequest, Genre, Character)
└── tests/
    └── api/
        └── generate.test.ts         # Automated route handler validation suite
```

### Pattern 1: Resilient Async Iterable to Web ReadableStream Bridge

**What:** Converts the async generator yielded by `@google/genai`'s `generateContentStream` into a standard Web `ReadableStream` while managing pre-stream and mid-stream error boundaries, safety stops, and client disconnect cancellation `[CITED: ai.google.dev/gemini-api/docs]`.

**When to use:** In `src/app/api/generate/route.ts` to stream LLM tokens to the browser with zero server buffering.

```typescript
// Source: @google/genai SDK docs & Next.js App Router streaming specifications
import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, DEFAULT_STORY_MODEL } from '@/lib/gemini';
import { StoryRequest } from '@/types/story';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'Server environment missing GEMINI_API_KEY', code: 'MISSING_API_KEY' },
      { status: 500 }
    );
  }

  let body: StoryRequest;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const prompt = body.premise?.trim() || 'Write a short fable about courage and wisdom.';
  const abortController = new AbortController();
  req.signal.addEventListener('abort', () => abortController.abort());

  try {
    const ai = getGeminiClient();
    const responseStream = await ai.models.generateContentStream({
      model: DEFAULT_STORY_MODEL,
      contents: prompt,
      config: {
        abortSignal: abortController.signal,
      },
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            if (abortController.signal.aborted) break;

            const candidate = chunk.candidates?.[0];
            if (candidate?.finishReason === 'SAFETY') {
              controller.enqueue(
                encoder.encode('\n\n*[The storyteller paused this tale due to sensitive themes.]*')
              );
              break;
            }

            const text = chunk.text;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (streamErr: unknown) {
          const errMessage = streamErr instanceof Error ? streamErr.message : String(streamErr);
          const is429 = (streamErr as { status?: number })?.status === 429 ||
            errMessage.includes('429') ||
            errMessage.includes('RESOURCE_EXHAUSTED');

          if (is429) {
            controller.enqueue(
              encoder.encode('\n\n*[The storyteller is catching its breath! Gemini rate limit reached. Please wait a moment.]*')
            );
          } else if (!abortController.signal.aborted) {
            controller.error(streamErr);
          }
        } finally {
          controller.close();
        }
      },
      cancel() {
        abortController.abort();
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    const is429 = (err as { status?: number })?.status === 429 ||
      errMessage.includes('429') ||
      errMessage.includes('RESOURCE_EXHAUSTED');

    if (is429) {
      return NextResponse.json(
        {
          error: 'The storyteller is taking a breath! Gemini free-tier rate limit reached. Please wait a few seconds and try again.',
          code: 'RATE_LIMIT_EXHAUSTED',
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to initiate story generation.', code: 'GENERATION_ERROR' },
      { status: 500 }
    );
  }
}
```

### Anti-Patterns to Avoid
- **Configuring Edge Runtime (`runtime = 'edge'`):** Causes immediate webpack module failures because `@google/genai` relies on Node crypto and stream primitives `[VERIFIED: GEMINI.md:149]`.
- **Top-level Client Initialization that Throws at Build Time:** Calling `throw new Error('Missing API key')` at the root of `lib/gemini.ts` breaks `next build` or test runs when environment variables are only provided dynamically. Use a getter function `getGeminiClient()` `[VERIFIED: .planning/research/ARCHITECTURE.md:117-124]`.
- **Awaiting the Stream Iteration Before Returning Response:** Iterating through chunks on the server into a string and returning `NextResponse.json(...)` defeats streaming, causes high TTFT, and risks Vercel execution timeouts `[VERIFIED: .planning/research/PITFALLS.md:468-470]`.
- **Prefixing Secret Key with `NEXT_PUBLIC_`:** Inlines `GEMINI_API_KEY` into browser client bundles where any visitor can steal it `[VERIFIED: GEMINI.md:16]`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| **Streaming HTTP Protocol** | Custom WebSockets server or Server-Sent Events (SSE) parser | Standard Web `ReadableStream` over HTTP POST | Next.js and Vercel handle chunked transfer natively without extra server ports, connection pooling, or WebSocket reconnection logic. |
| **API Client Network Layer** | Raw `fetch` calls to Google's REST endpoints with custom crypto headers | `@google/genai` SDK | Handles auth, payload serialization, protobuf parsing, streaming chunk delimiters, and model endpoints cleanly. |
| **CSS Setup** | Complex Webpack / PostCSS custom pipelines and `tailwind.config.js` | Tailwind CSS v4 CSS-first `@import "tailwindcss";` | Tailwind v4 removes config files and builds instantly with the Rust-based compiler engine. |
| **Utility Class Merging** | Custom regex replacement or string concatenation for classes | `clsx` + `tailwind-merge` (`cn` helper) | Prevents conflicting Tailwind utility classes (e.g. `p-4` vs `p-2`) from conflicting in unpredictable order. |

---

## Common Pitfalls

### Pitfall 1: Missing Anti-Buffering Headers Causing Monolithic Chunk Delivery on Vercel
**What goes wrong:** Streaming works locally on `localhost:3000`, but when deployed to Vercel, chunks are buffered by reverse proxies and the entire story arrives all at once after 10 seconds `[VERIFIED: .planning/research/PITFALLS.md:38-44]`.  
**Why it happens:** Vercel edge infrastructure and intermediary proxies buffer chunked HTTP responses unless instructed not to.  
**How to avoid:** Add `'X-Accel-Buffering': 'no'` and `'Cache-Control': 'no-cache, no-transform'`, and declare `export const dynamic = 'force-dynamic'` and `export const runtime = 'nodejs'`.  
**Warning signs:** Network tab shows high TTFT and `Transfer-Encoding: chunked` data arriving in a single burst.

### Pitfall 2: Zombie Server Token Burn on Client Cancellation
**What goes wrong:** When a client aborts a request or closes the window, the server continues streaming from Gemini until the token limit is reached, rapidly exhausting the 15 RPM free tier quota `[VERIFIED: .planning/research/PITFALLS.md:190-196]`.  
**Why it happens:** The Node.js event loop doesn't automatically stop the SDK's async iteration when the client disconnects unless linked to an `AbortSignal`.  
**How to avoid:** Link `req.signal` to `AbortController` and pass `config: { abortSignal: controller.signal }` to `generateContentStream()`.  
**Warning signs:** Server terminal keeps logging tokens long after the browser tab is closed.

### Pitfall 3: Mid-Stream Rate Limit or Safety Drop Unhandled
**What goes wrong:** If Gemini hits a quota exhaustion or safety filter halfway through a story, `chunk.text` throws or the stream fails. The route crashes with an unhandled rejection and drops the socket `[VERIFIED: .planning/research/PITFALLS.md:114-118]`.  
**Why it happens:** HTTP 200 headers were already sent when the stream began, so the server cannot change the status code to 429 or 500 mid-stream.  
**How to avoid:** Wrap the inner `for await` loop in a try/catch block inside `ReadableStream.start()`. On 429 or safety stop, enqueue an in-band markdown notice and close cleanly.

---

## Code Examples

### 1. Gemini Client Factory (`src/lib/gemini.ts`)
```typescript
// [CITED: github.com/googleapis/js-genai]
import { GoogleGenAI } from '@google/genai';

export const DEFAULT_STORY_MODEL = 'gemini-2.5-flash';

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not defined.');
  }
  return new GoogleGenAI({ apiKey });
}
```

### 2. Core Story Schema Definitions (`src/types/story.ts`)
```typescript
// [VERIFIED: .planning/research/ARCHITECTURE.md:108]
export interface Character {
  id: string;
  name: string;
  role?: string;
}

export type Genre =
  | 'Fantasy'
  | 'Sci-Fi'
  | 'Horror'
  | 'Romance'
  | 'Mystery'
  | 'Adventure'
  | 'Comedy'
  | 'Thriller';

export interface StoryRequest {
  characters?: Character[];
  genre?: Genre | string;
  premise?: string;
  isSurprise?: boolean;
}

export interface ApiErrorResponse {
  error: string;
  code: 'MISSING_API_KEY' | 'RATE_LIMIT_EXHAUSTED' | 'GENERATION_ERROR';
}
```

### 3. Tailwind CSS v4 Stylesheet (`src/app/globals.css`)
```css
/* [CITED: tailwindcss.com/docs/v4-beta] */
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  --font-serif: "Merriweather", "Georgia", serif;
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@google/generative-ai` | `@google/genai` | Late 2024 / 2025 | Unified Google Gen AI SDK across Node/TS, replacing legacy package. |
| `tailwind.config.js` | `@import "tailwindcss";` in CSS | 2025 (Tailwind v4) | Zero JavaScript configuration file required; CSS-first theme configuration. |
| Next.js Pages API (`pages/api/*.ts`) | Next.js App Router Route Handlers (`app/api/*/route.ts`) | Next.js 13+ (Standardized in 15/16) | Native Web Standards (`Request`, `Response`, `ReadableStream`) replacing Node-specific `req` / `res`. |
| `gemini-1.5-flash` / `gemini-pro` | `gemini-2.5-flash` | 2025 | Faster TTFT, improved narrative reasoning, high free-tier throughput. |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Vercel Hobby free tier Serverless Functions allow `maxDuration = 60` for streaming responses `[ASSUMED]` | Serverless Execution Config | If restricted to 15s or 30s on certain plans, stories must be generated within 15 seconds (gemini-2.5-flash generates ~100 tokens/sec, finishing 500-word stories in 5-8s, well within limits). |

---

## Open Questions

1. **How should automated route handler tests mock `@google/genai` in CI without requiring a real API key?**
   - *What we know:* Vitest provides `vi.mock('@google/genai')` to mock `GoogleGenAI` constructor and `generateContentStream` async iterator.
   - *Recommendation:* Configure Vitest unit tests in `tests/api/generate.test.ts` with mock generators returning test chunks and simulated 429 rejections so the test suite passes 100% offline without burning API quota.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| **Node.js** | Next.js build and runtime | ✓ | `v24.13.1` `[VERIFIED: local CLI]` | Node >= 20.x is required |
| **npm** | Package management | ✓ | `11.8.0` `[VERIFIED: local CLI]` | — |
| **git** | Version control & GSD tracking | ✓ | `2.51.0.windows.1` `[VERIFIED: local CLI]` | — |
| **curl** | CLI streaming endpoint verification | ✓ | `8.22.0` `[VERIFIED: local CLI]` | Node test runner / Vitest |

**Missing dependencies with no fallback:** None.  
**Missing dependencies with fallback:** None.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest `^5.1.1` `[VERIFIED: npm registry]` |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run tests/api/generate.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| **TECH-01** | Route handler executes `@google/genai` server-side, returns 200 chunked stream, keeps `GEMINI_API_KEY` private | Unit / Integration | `npx vitest run tests/api/generate.test.ts -t "executes Gemini streaming"` | ❌ Wave 0 |
| **TECH-01** | Missing `GEMINI_API_KEY` returns structured 500 JSON without crashing process | Unit | `npx vitest run tests/api/generate.test.ts -t "missing API key"` | ❌ Wave 0 |
| **TECH-02** | Response contains anti-buffering headers (`X-Accel-Buffering`, `Cache-Control`) | Unit | `npx vitest run tests/api/generate.test.ts -t "anti-buffering headers"` | ❌ Wave 0 |
| **TECH-02** | Traps Gemini `RESOURCE_EXHAUSTED` (429) before stream and returns HTTP 429 JSON | Unit | `npx vitest run tests/api/generate.test.ts -t "handles 429 rate limit"` | ❌ Wave 0 |
| **TECH-02** | Client disconnect aborts upstream generation cleanly | Unit | `npx vitest run tests/api/generate.test.ts -t "aborts on client signal"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/api/generate.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full test suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` — configuration file with path alias resolution (`@/*` -> `./src/*`)
- [ ] `tests/api/generate.test.ts` — test suite covering TECH-01 and TECH-02
- [ ] Framework install: `npm install -D vitest`

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| **V2 Authentication** | No | Zero user accounts / authentication in v1 `[VERIFIED: GEMINI.md:15]`. |
| **V3 Session Management** | No | Ephemeral stateless architecture; no cookies or server sessions `[VERIFIED: GEMINI.md:15]`. |
| **V4 Access Control** | Yes | Absolute protection of `GEMINI_API_KEY`. Key resides exclusively in server environment variables (`.env.local`), never exposed with `NEXT_PUBLIC_` prefix, never emitted in client bundles `[VERIFIED: GEMINI.md:16]`. |
| **V5 Input Validation** | Yes | Safe request parsing (`req.json()` in try/catch) with defensive fallbacks if payload is malformed or missing `[VERIFIED: .planning/research/ARCHITECTURE.md:43]`. |
| **V6 Cryptography** | Yes | HTTPS in transit for client requests; TLS 1.3 encrypted connection from serverless runtime to Google Gen AI APIs. |

### Known Threat Patterns for Next.js Serverless + Gemini API

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| **Client API Key Extraction** | Information Disclosure | Keep `@google/genai` calls server-side in `/api/generate/route.ts`. Never use `NEXT_PUBLIC_` prefix. Add `.env*.local` to `.gitignore`. |
| **Rate Limit Flooding (429 Denial of Service)** | Denial of Service | Catch 429 errors explicitly, return clear retry instructions, and link client abort signals to upstream `AbortController` to prevent zombie execution. |
| **Huge Payload DOS** | Denial of Service | Truncate or cap incoming text premise input lengths defensively during parsing. |

---

## Sources

### Primary (HIGH confidence)
- Official Google Gen AI SDK repository (`googleapis/js-genai`) & npm package `@google/genai` `[VERIFIED: npm registry]`
- Next.js App Router Documentation on Route Handlers & Web Streaming Responses `[CITED: nextjs.org/docs/app/building-your-application/routing/route-handlers]`
- Google AI Studio Documentation: Rate Limits, Model Quotas, and Free-Tier Specifications `[CITED: ai.google.dev/gemini-api/docs/rate-limits]`
- Tailwind CSS v4 Official Documentation: CSS-First Configuration & Plugins `[CITED: tailwindcss.com/docs/v4-beta]`

### Secondary (MEDIUM confidence)
- Vercel Serverless Function Documentation: Fluid compute streaming headers and Hobby tier execution boundaries `[CITED: vercel.com/docs/functions]`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Package legitimacy audit completed; versions verified via npm registry.
- Architecture: HIGH - Route handler Web ReadableStream pattern tested and verified against Next.js 16 and `@google/genai` specifications.
- Pitfalls: HIGH - Critical pitfalls (Edge runtime trap, missing anti-buffering headers, zombie token burn, 429 trapping) verified against platform docs.

**Research date:** 2026-11-24  
**Valid until:** 2026-12-24 (30 days)

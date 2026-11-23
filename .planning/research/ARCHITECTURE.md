# Architecture Research

**Domain:** Generative AI Story Generator Web Application  
**Researched:** 2026-11-24  
**Confidence:** HIGH  

---

## Standard Architecture

### System Overview

The standard architecture for a lightweight, serverless Generative AI web application using Next.js App Router and the Google Gemini API is a two-tier decoupled system: a **Client Presentation & State Tier** (React client components managing user interactions and real-time chunk consumption) and a **Serverless Streaming Route Tier** (Next.js API route executing server-side prompt assembly and piping `@google/genai` token streams directly to the browser via Web `ReadableStream`).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CLIENT TIER (Next.js / React)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────┐  ┌─────────────────┐  ┌──────────────────────┐  │
│  │ Character & Form Input │  │  Surprise Me    │  │ Action Controls      │  │
│  │ (Dynamic character list│  │  Trigger        │  │ (Copy to clipboard,  │  │
│  │  genre, premise fields)│  │  (Randomizer)   │  │  Regenerate, Reset)  │  │
│  └───────────┬────────────┘  └────────┬────────┘  └──────────┬───────────┘  │
│              │                        │                      │              │
│              └────────────────────────┼──────────────────────┘              │
│                                       ▼                                     │
│                     ┌───────────────────────────────────┐                   │
│                     │       useStoryStream Hook         │                   │
│                     │  (Fetch, AbortCtrl, Stream Reader)│                   │
│                     └─────────────────┬─────────────────┘                   │
│                                       ▲ ▼                                   │
│                     ┌─────────────────┴─────────────────┐                   │
│                     │        StoryDisplay View          │                   │
│                     │  (Incremental markdown / text)   │                   │
│                     └───────────────────────────────────┘                   │
├───────────────────────────────────────┼─────────────────────────────────────┤
│                         NETWORK BOUNDARY (HTTP POST / ReadableStream)       │
├───────────────────────────────────────┼─────────────────────────────────────┤
│                       SERVER TIER (Next.js App Router)                      │
├───────────────────────────────────────┼─────────────────────────────────────┤
│                     ┌─────────────────▼─────────────────┐                   │
│                     │   /api/generate Route Handler     │                   │
│                     │   (POST request validation)       │                   │
│                     └─────────────────┬─────────────────┘                   │
│                                       │                                     │
│                     ┌─────────────────▼─────────────────┐                   │
│                     │   Prompt Builder & Formatter      │                   │
│                     │  (Fallbacks, structure enforcement│                   │
│                     │   Beginning/Middle/Climax/End)    │                   │
│                     └─────────────────┬─────────────────┘                   │
│                                       │                                     │
│                     ┌─────────────────▼─────────────────┐                   │
│                     │   Gemini Client (@google/genai)   │                   │
│                     │   (Secure GEMINI_API_KEY from env)│                   │
│                     └─────────────────┬─────────────────┘                   │
├───────────────────────────────────────┼─────────────────────────────────────┤
│                         EXTERNAL SERVICE BOUNDARY                           │
├───────────────────────────────────────┼─────────────────────────────────────┤
│                     ┌─────────────────▼─────────────────┐                   │
│                     │     Google Gemini AI Platform     │                   │
│                     │   (models.generateContentStream)  │                   │
│                     └───────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **`StoryForm`** | Captures story parameters; manages dynamic characters, genre dropdown, and optional premise | Client Component (`'use client'`) using standard React state or uncontrolled inputs |
| **`CharacterInputList`** | Allows adding, updating, and removing character name & role fields | Controlled list component embedded in `StoryForm` |
| **`SurpriseButton`** | Triggers instantaneous generation with randomized creative inputs | Trigger button that dispatches a surprise-mode request |
| **`StoryDisplay`** | Renders streaming story content incrementally as chunks arrive from the server | React component displaying formatted text/markdown with streaming cursor |
| **`StoryControls`** | Provides action buttons: Copy to Clipboard, Regenerate with same inputs, Reset | Stateless UI buttons hooked into parent stream state |
| **`useStoryStream`** | Encapsulates network communication, stream chunk decoding, abort handling, and error states | Custom React Hook wrapping `fetch`, `ReadableStreamDefaultReader`, and `TextDecoder` |
| **`app/api/generate/route.ts`** | Validates incoming payloads, coordinates prompt synthesis, and streams back response | Next.js App Router POST Route Handler utilizing Web `ReadableStream` |
| **`PromptBuilder` (`lib/prompts.ts`)** | Sanitizes inputs, applies intelligent defaults for missing fields, and enforces narrative structure | Pure TypeScript function with structured narrative prompt templates |
| **`GeminiClient` (`lib/gemini.ts`)** | Instantiates `@google/genai` client securely using server-side environment variables | Singleton module initializing `new GoogleGenAI({ apiKey })` |

---

## Recommended Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts         # Serverless streaming route handler
│   ├── favicon.ico
│   ├── globals.css              # Tailwind CSS styles and custom animations
│   ├── layout.tsx               # Root layout, HTML skeleton, metadata
│   └── page.tsx                 # Main application page orchestrating form & display
├── components/
│   ├── CharacterInputList.tsx   # Dynamic character item add/remove list
│   ├── GenreSelector.tsx        # Genre selection pills/dropdown
│   ├── Header.tsx               # Application banner and title
│   ├── StoryControls.tsx        # Copy, Regenerate, and Clear action toolbar
│   ├── StoryDisplay.tsx         # Real-time streaming markdown/text viewer
│   └── StoryForm.tsx            # Main input form combining characters, genre, premise
├── hooks/
│   └── useStoryStream.ts        # Custom streaming hook (fetch, reader, abort controller)
├── lib/
│   ├── constants.ts             # Genre definitions, default fallbacks, model IDs
│   ├── gemini.ts                # GoogleGenAI client initialization
│   └── prompts.ts               # Prompt construction and structural template logic
└── types/
    └── story.ts                 # Shared TypeScript interfaces (StoryRequest, Character, Genre)
```

### Structure Rationale

- **`src/app/api/generate/route.ts`:** Isolates server-side logic from the client bundle. By locating the Gemini API calls inside this route handler, the `GEMINI_API_KEY` remains strictly protected in server environment variables (`process.env.GEMINI_API_KEY`).
- **`src/components/`:** Modularizes UI elements. Separating the input components (`StoryForm`, `CharacterInputList`) from output components (`StoryDisplay`, `StoryControls`) prevents re-rendering the input form while tokens are streaming into the display.
- **`src/hooks/useStoryStream.ts`:** Extracts low-level stream reading (`response.body.getReader()`, `TextDecoder`, chunk concatenation, error catching) out of the UI components, keeping React components clean and focused strictly on presentation.
- **`src/lib/`:** Centralizes core business logic. `prompts.ts` houses narrative templates and fallback rules, making prompt adjustments simple to test and iterate without touching API routing or UI code.

---

## Architectural Patterns

### Pattern 1: Direct Async Iterable to Web ReadableStream Bridge

**What:** Google Gen AI's `ai.models.generateContentStream` returns an `AsyncIterable<GenerateContentResponse>`. Next.js Route Handlers in App Router support Web API `ReadableStream`. The bridge converts chunks yielded by the async generator into a `Uint8Array` stream piped directly into a native Web `Response`.

**When to use:** In `/api/generate/route.ts` when streaming real-time tokens to the client without buffering the complete response in memory.

**Trade-offs:** 
- *Pros:* Ultra-low time-to-first-token (TTFT); minimal memory footprint on Vercel serverless functions; keeps HTTP connection alive preventing gateway timeouts.
- *Cons:* Error handling mid-stream requires stream error propagation rather than HTTP status code mutation (since HTTP 200 headers have already been transmitted).

**Example:**
```typescript
// src/app/api/generate/route.ts
import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { buildStoryPrompt } from '@/lib/prompts';
import { StoryRequest } from '@/types/story';

export const maxDuration = 60; // Max execution limit for streaming

const ai = new GoogleGenAI(); // Automatically reads process.env.GEMINI_API_KEY

export async function POST(req: NextRequest) {
  try {
    const body: StoryRequest = await req.json();
    const prompt = buildStoryPrompt(body);

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  } catch (error: unknown) {
    console.error('Generation route error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate story generation.' },
      { status: 500 }
    );
  }
}
```

---

### Pattern 2: Prompt Formatter Pipeline with Intelligent Fallbacks

**What:** A pure function pipeline that ingests optional characters, optional genre, and optional premise, and normalizes them into an unambiguous, structured prompt. It handles the "Intelligent Fallback" requirement by supplying creative defaults when fields are left blank, and strictly dictates the required output structure (Title, Beginning, Middle, Climax, Conclusion).

**When to use:** Whenever compiling user form data or "Surprise Me" actions into the LLM prompt payload.

**Trade-offs:**
- *Pros:* Deterministic narrative structure; works reliably even if the user clicks "Generate" on an empty form; centralized testing of prompt rules.
- *Cons:* Slightly longer prompt token count to enforce section headings and stylistic constraints.

**Example:**
```typescript
// src/lib/prompts.ts
import { StoryRequest } from '@/types/story';

export function buildStoryPrompt(req: StoryRequest): string {
  const { characters = [], genre, premise, isSurprise } = req;

  let characterContext = 'Characters: Invent compelling, unique protagonists with distinct motivations.';
  if (characters.length > 0) {
    const charList = characters
      .filter((c) => c.name.trim().length > 0)
      .map((c) => `- ${c.name}${c.role ? ` (${c.role})` : ''}`)
      .join('\n');
    if (charList) {
      characterContext = `Characters:\n${charList}`;
    }
  }

  const genreContext = genre
    ? `Genre: ${genre}`
    : 'Genre: Choose an imaginative genre that fits the narrative best.';

  const premiseContext = premise && premise.trim().length > 0
    ? `Premise / Seed: ${premise.trim()}`
    : 'Premise: Invent an intriguing, original premise with unexpected turns.';

  const surpriseDirective = isSurprise
    ? 'SPECIAL DIRECTIVE: This is "Surprise Me" mode. Create an extraordinarily original, unpredictable tale.'
    : '';

  return `
You are a master storyteller. Write a captivating, high-quality, and coherent story based on the specifications below.

${surpriseDirective}
${genreContext}
${characterContext}
${premiseContext}

CRITICAL FORMATTING INSTRUCTIONS:
Organize the story clearly into the following narrative arc:
1. # [Story Title]
2. ## Beginning
   (Establish setting, tone, and character introductions)
3. ## Middle
   (Develop rising tension, obstacles, and complications)
4. ## Climax
   (The decisive, high-stakes turning point)
5. ## Conclusion
   (Meaningful resolution, aftermath, or moral insight)

Ensure smooth transitions, evocative prose, and distinct character voices. Deliver only the story content in Markdown format.
`.trim();
}
```

---

### Pattern 3: Decoupled Streaming Consumer Hook (`useStoryStream`)

**What:** A custom React Hook that abstracts the browser's `fetch()` call, manages `AbortController` (to cancel ongoing generation when the user navigates away or resets), reads chunks incrementally with `TextDecoder`, and exposes state variables (`story`, `isStreaming`, `error`, `generateStory`, `cancelStream`).

**When to use:** On the client side in `page.tsx` or `StoryDisplay.tsx` to drive the UI.

**Trade-offs:**
- *Pros:* Fully decouples network streaming logistics from React UI rendering; provides clean state transitions; allows cancellation at any moment.
- *Cons:* Requires disciplined cleanup handling on unmount.

**Example:**
```typescript
// src/hooks/useStoryStream.ts
import { useState, useRef, useCallback } from 'react';
import { StoryRequest } from '@/types/story';

export function useStoryStream() {
  const [story, setStory] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateStory = useCallback(async (params: StoryRequest) => {
    // Cancel any previous stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsStreaming(true);
    setError(null);
    setStory('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Generation failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setStory((prev) => prev + chunk);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Stream aborted by user; no error display needed
        return;
      }
      setError(err instanceof Error ? err.message : 'Unknown generation error');
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, []);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return { story, isStreaming, error, generateStory, cancelStream, setStory };
}
```

---

## Data Flow

### Request Flow

```
User Action (Click "Generate Story" or "Surprise Me")
   │
   ▼
[StoryForm / Page Component]
   │  Gathers form state { characters, genre, premise, isSurprise }
   ▼
[useStoryStream.generateStory()]
   │  Dispatches HTTP POST to /api/generate with JSON payload
   ▼
[app/api/generate/route.ts]
   │  1. Parses JSON request body
   │  2. Passes parameters to buildStoryPrompt()
   ▼
[lib/prompts.ts (buildStoryPrompt)]
   │  Applies intelligent defaults for missing values
   │  Injects narrative structure (Title, Beginning, Middle, Climax, Conclusion)
   ▼
[@google/genai (ai.models.generateContentStream)]
   │  Sends streaming request to Gemini 2.5 Flash
   ▼
[Gemini API Cloud]
   │  Emits token chunks over HTTP connection
   ▼
[ReadableStream Controller (route.ts)]
   │  Encodes chunks with TextEncoder
   │  Pushes chunks into Web ReadableStream
   ▼
[Client Response Body Reader (useStoryStream)]
   │  Reads Uint8Array chunks via response.body.getReader()
   │  Decodes with TextDecoder({ stream: true })
   │  Appends incremental string to story state
   ▼
[StoryDisplay Component]
   │  Renders updated narrative text in real-time
   ▼
User views live-streamed story
```

### State Management

Because the application is stateless and ephemeral (no database or user accounts in v1), all application state lives strictly in the browser runtime:

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser Runtime                       │
│                                                             │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │    Form Input State   │       │   Stream Output State │  │
│  │ ───────────────────── │       │ ───────────────────── │  │
│  │ - characters: Array   │       │ - story: string       │  │
│  │ - genre: string       │       │ - isStreaming: boolean│  │
│  │ - premise: string     │       │ - error: string|null  │  │
│  │ - lastSubmittedParams │       └───────────┬───────────┘  │
│  └───────────┬───────────┘                   │              │
│              │                               │              │
│              ▼                               ▼              │
│        [StoryForm]                     [StoryDisplay]       │
│              │                               │              │
│              └───────────────┬───────────────┘              │
│                              │                              │
│                              ▼                              │
│                      [StoryControls]                        │
│                  - Copy (reads story)                       │
│                  - Regenerate (re-submits last params)      │
│                  - Reset (clears story & form)              │
└─────────────────────────────────────────────────────────────┘
```

### Key Data Flows

1. **Custom Story Generation Flow:**
   - User inputs characters, selects a genre, and enters a premise.
   - User clicks "Generate Story".
   - `lastSubmittedParams` is stored in state.
   - `generateStory(params)` executes, initiating chunked streaming.
   - The UI automatically scrolls to or highlights the `StoryDisplay` section.

2. **"Surprise Me" Autonomous Generation Flow:**
   - User clicks the dedicated "Surprise Me" button.
   - The handler immediately invokes `generateStory({ isSurprise: true })` without requiring any fields to be filled out.
   - Prompt builder injects surprise directives, instructing Gemini to invent unexpected character archetypes, uncommon genres, and surprising conflicts.
   - Stream renders real-time narrative.

3. **Regeneration Flow:**
   - User clicks "Regenerate" on an existing story.
   - The handler re-invokes `generateStory(lastSubmittedParams)`.
   - The stream resets the text display and streams a fresh, uniquely varied rendition of the tale from Gemini.

4. **Story Copy / Export Flow:**
   - User clicks "Copy to Clipboard".
   - Component invokes `navigator.clipboard.writeText(story)`.
   - Temporary visual indicator ("Copied!" checkmark) appears for 2 seconds.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0 - 1k users** | Single Next.js instance on Vercel Hobby plan. Zero database. All state in memory/client. Direct calls to Gemini free tier (15 requests per minute). Completely zero infrastructure cost. |
| **1k - 100k users** | Deploy on Vercel Pro with Fluid Compute to handle concurrent serverless streaming. Implement client-side rate limit throttling and retry logic for Gemini 429 errors. Introduce optional Upstash Redis cache for popular genre/premise pairings. |
| **100k+ users** | Transition from Gemini Free Tier to Pay-As-You-Go API tier with higher RPM quotas. Introduce user authentication (Clerk/NextAuth) and database storage (PostgreSQL/Supabase) for saving stories. Use edge proxy caching and background job queues (e.g. Inngest) if generation workloads exceed serverless execution windows. |

### Scaling Priorities & Bottlenecks

1. **First Bottleneck: Gemini Free Tier Rate Limits (15 RPM / 1,500 RPD):**
   - *Problem:* On the free tier, more than 15 requests within a 60-second window will trigger HTTP 429 (Too Many Requests).
   - *Mitigation:* The client UI must provide clear feedback when rate limits are approached, disable duplicate clicks on the generate button while a request is pending, and present friendly retry counters if a 429 response is received from the API route.
2. **Second Bottleneck: Serverless Function Timeout:**
   - *Problem:* Default serverless execution timeouts on free platforms can abort long stories.
   - *Mitigation:* Explicitly set `export const maxDuration = 60` in the route handler, use the lightweight, fast `gemini-2.5-flash` model (which generates 100+ tokens per second, completing stories in 4-8 seconds), and stream chunks immediately via `ReadableStream` rather than waiting for completion.

---

## Anti-Patterns

### Anti-Pattern 1: Leaking `GEMINI_API_KEY` to Client Bundles

**What people do:** Initializing `GoogleGenAI` in a React client component or prefixing the key with `NEXT_PUBLIC_GEMINI_API_KEY`.  
**Why it's wrong:** Any user inspecting network requests or bundle files can steal the API key, exhausting rate limits and potentially running up unauthorized charges.  
**Do this instead:** Keep the SDK strictly server-side in `app/api/generate/route.ts` or `src/lib/gemini.ts`. Access the key via standard `process.env.GEMINI_API_KEY`.

### Anti-Pattern 2: Buffering the Stream Before Sending Response

**What people do:** Calling `const result = await ai.models.generateContent(...)` or awaiting the full `for await (const chunk of responseStream)` loop on the server before calling `return NextResponse.json(...)`.  
**Why it's wrong:** The user stares at a blank screen for 6–12 seconds until the full story finishes. This causes high perceived latency and increases the risk of function timeouts.  
**Do this instead:** Return the `new Response(readableStream)` immediately, streaming chunks to the browser the millisecond Gemini emits them.

### Anti-Pattern 3: Massive Monolith Client Component

**What people do:** Putting the entire application (form inputs, character state, streaming fetch, text viewer, copy logic, layout) into a single 600-line `page.tsx`.  
**Why it's wrong:** Every received stream chunk triggers a re-render of all form inputs, character inputs, and buttons, causing sluggish typing, cursor jumping, and poor code maintainability.  
**Do this instead:** Keep form state isolated in `StoryForm`, streaming output state in `useStoryStream` / `StoryDisplay`, and action buttons in `StoryControls`.

### Anti-Pattern 4: Unconstrained Freeform Prompting

**What people do:** Passing raw user input directly to Gemini: `contents: "Write a story about " + userInput`.  
**Why it's wrong:** Generates erratic story lengths, lacks structural pacing (often missing a climax or ending abruptly), fails completely when inputs are empty, and allows prompt injection.  
**Do this instead:** Use `buildStoryPrompt()` to enforce a clear narrative skeleton (# Title, Beginning, Middle, Climax, Conclusion) and supply intelligent defaults when fields are left blank.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Google Gemini API** (`@google/genai`) | Server-to-server HTTPS via SDK streaming method `ai.models.generateContentStream` | Uses `gemini-2.5-flash`. Key configured in `.env.local`. Rate limited to 15 RPM on free tier. |
| **Vercel Serverless Platform** | Node.js Serverless Function runtime (`maxDuration = 60`) | Fluid Compute enables chunked streaming without premature socket termination. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **`StoryForm` ↔ `page.tsx`** | React Callback / Props (`onSubmit(params)`) | Emits clean `StoryRequest` object containing character array, genre, and premise. |
| **`page.tsx` ↔ `useStoryStream`** | Hook Interface (`generateStory`, `story`, `isStreaming`) | Separates UI view state from streaming I/O logic. |
| **`useStoryStream` ↔ `/api/generate`** | HTTP POST `ReadableStream` | Transmits JSON payload; receives chunked `text/plain` UTF-8 byte stream. |
| **`/api/generate` ↔ `lib/prompts.ts`** | Synchronous Function Call (`buildStoryPrompt(req)`) | Pure function; easily unit-testable without mocking network requests. |
| **`/api/generate` ↔ `lib/gemini.ts`** | Node.js SDK Call (`ai.models.generateContentStream`) | Executes within server context; isolated from browser environment. |

---

## Component Dependencies & Suggested Build Order

To deliver the project efficiently with minimal friction and maximum testability, the system should be constructed in **5 sequential layers**, respecting clear dependency boundaries:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DEPENDENCY GRAPH & BUILD ORDER                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Phase 1: Foundation & Types                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ types/story.ts (Interfaces) + Next.js App Router Scaffold + Tailwind│   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│   Phase 2: Core Prompt & API Streaming Layer                                │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ lib/prompts.ts (Prompt builder & fallbacks)                         │   │
│   │ lib/gemini.ts (SDK initialization)                                  │   │
│   │ app/api/generate/route.ts (Streaming route handler)                │   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│   Phase 3: Client Streaming Hook & State Engine                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ hooks/useStoryStream.ts (Fetch, Web Stream Reader, Decoders)        │   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│   Phase 4: Modular UI Components                                            │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ CharacterInputList.tsx + GenreSelector.tsx + StoryForm.tsx          │   │
│   │ StoryDisplay.tsx (Live streaming display)                           │   │
│   │ StoryControls.tsx (Copy to clipboard, Regenerate, Reset)            │   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│   Phase 5: Page Assembly, "Surprise Me" Mode & Vercel Verification          │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ app/page.tsx (Orchestration, layout polish, responsive design)      │   │
│   │ End-to-end testing, error handling UX, Vercel deployment check      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Rationale for Build Order

1. **Build the Server & Prompt Logic First (Phases 1 & 2):**
   - The backend streaming route handler (`/api/generate`) has zero UI dependencies.
   - It can be immediately tested and verified using `curl` or Postman to confirm that Gemini API authentication, prompt formatting, and chunked HTTP streaming work correctly before writing a single line of React frontend code.
2. **Build the Client Streaming Hook Next (Phase 3):**
   - Encapsulating the `ReadableStream` reader in `useStoryStream` guarantees robust error and cancellation handling. Testing this hook with a minimal UI proves stream consumption without distractions from complex forms.
3. **Build UI Components in Isolation (Phase 4):**
   - Developing `StoryForm` (with dynamic character addition/removal) and `StoryDisplay` separately ensures that each component can be visually verified and styled with Tailwind CSS.
4. **Integrate and Deploy (Phase 5):**
   - With all discrete components validated, `app/page.tsx` simply wires them together. Implementing "Surprise Me" and "Regenerate" is straightforward because the underlying hook and route handler already support parameter variation.

---

## Sources

- **Google Gen AI SDK for Node.js (`@google/genai`):** Official SDK reference for `ai.models.generateContentStream` and model specifications.
- **Next.js App Router Documentation:** Route Handlers, Web `ReadableStream` streaming specifications, and `maxDuration` runtime configuration.
- **Vercel Serverless Function Guidelines:** Streaming responses, fluid compute, and execution timeout constraints.

---
*Architecture research for: Generative AI Story Generator Web Application (AIsop's Fables / StoryForge AI)*  
*Researched: 2026-11-24*

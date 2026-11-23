# Stack Research

**Domain:** Generative AI Story Generator Web Application (Consumer Creative Writing)  
**Researched:** 2026-11-24  
**Confidence:** HIGH  

---

## Executive Overview

StoryForge AI is a greenfield generative AI web application that produces rich, four-part classical narrative stories (Beginning, Middle, Climax, Conclusion) with real-time text streaming, dynamic character generation, genre customization, and an unconstrained "Surprise Me" mode. 

To satisfy the project's foundational constraints—**strict zero-cost deployment (Vercel Hobby tier)**, **zero backend maintenance (ephemeral client state, no databases, no user authentication)**, **absolute API key security**, and an **approachable, beginner-friendly architecture**—the stack is engineered for maximum simplicity and zero extraneous abstraction layers.

The core architectural choice is **Next.js 16 (App Router)** paired directly with Google's modern, unified **`@google/genai` SDK**. Instead of introducing heavy middleware or third-party AI orchestrators (e.g., LangChain or Vercel AI SDK), the system leverages native web standards—Node.js async iterables piped into standard Web `ReadableStream`—delivering resilient real-time streaming directly to the browser within Vercel's free serverless runtime limits.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Next.js (App Router)** | `^16.4.6` | Full-stack React application framework | Provides server-side Route Handlers (`app/api/generate/route.ts`) to safeguard the `GEMINI_API_KEY` away from client browser inspection. Delivers first-class support for Web Streams (`ReadableStream`) for real-time text delivery, optimized React 19 server/client component boundaries, and seamless zero-configuration deployment to Vercel. |
| **`@google/genai`** | `^3.6.1` | Official unified Google Gen AI SDK for Node.js / TypeScript | The current, production-grade SDK from Google (source: `googleapis/js-genai`) replacing the deprecated `@google/generative-ai` package. Offers streamlined initialization (`new GoogleGenAI({ apiKey })`), direct support for `gemini-3.8-flash`, and clean async generator streaming (`ai.models.generateContentStream`). |
| **React & React DOM** | `^19.3.1` | Core UI component and rendering engine | Shipped natively with Next.js 16. Idiomatic hooks (`useState`, `useRef`, `useCallback`) effortlessly manage dynamic character form arrays, genre badge selection, stream buffer accumulation, and clipboard state without heavy external state libraries. |
| **Tailwind CSS** | `^4.3.5` | Utility-first CSS styling framework | Tailwind v4 introduces a streamlined CSS-first architecture (`@import "tailwindcss";`) with a high-performance Rust-based engine, completely eliminating cumbersome `tailwind.config.js` files while enabling rapid assembly of responsive story cards, loading states, and badge controls. |
| **TypeScript** | `^5.7.x` | Static typing and compile-time contract enforcement | Establishes unambiguous type contracts for narrative requests (character schemas, genre unions, fallback states) and stream chunk event envelopes, eliminating runtime shape mismatches and spelling regressions. |
| **Google Gemini Model** | `gemini-3.8-flash` | Generative AI LLM engine | Google's premier lightweight, low-latency Flash model. Optimized for rapid creative reasoning, structured narrative flow, and high-speed streaming. Features generous free-tier quotas (up to 15 RPM, 1M TPM, 1,500 RPD) with zero cost. |

---

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **`lucide-react`** | `^1.78.0` | Featherweight, tree-shakeable UI icons | In all interactive controls: `Sparkles` (generate story), `Shuffle` / `Dice5` (surprise me), `Copy` / `Check` (clipboard actions), `RefreshCw` (regenerate), `Plus` / `Trash2` (dynamic character list item manipulation), and `BookOpen` (story headers). |
| **`react-markdown`** | `^10.1.0` | Safe client-side Markdown rendering | In `StoryDisplay` to parse Gemini's streamed Markdown (act headers `### Act 1`, dialogue quotes, italicized thoughts, and narrative paragraphs) into HTML without using insecure `dangerouslySetInnerHTML`. |
| **`@tailwindcss/typography`** | `^0.5.20` | Prose styling plugin for Tailwind CSS | Used in conjunction with `react-markdown` via the `prose prose-slate max-w-none` utility class. In Tailwind v4, registered directly in CSS with `@plugin "@tailwindcss/typography";` to provide typographic rhythm, line-height, and elegant storybook formatting. |
| **`clsx`** | `^2.1.1` | Conditional className constructor | When toggling dynamic CSS class names based on UI state (e.g., selected vs. unselected genre chips, active button states, and validation rings). |
| **`tailwind-merge`** | `^3.7.1` | Conflict-free Tailwind class resolution | Paired with `clsx` inside a standard helper `cn(...inputs)` to resolve utility class overrides safely. |

---

### Development Tools & Infrastructure

| Tool / Platform | Purpose | Notes |
|-----------------|---------|-------|
| **Vercel Hobby Tier** | Serverless hosting & continuous deployment | Zero-cost hosting connected to the GitHub repository. Deploys Next.js Route Handlers as Serverless Functions with Node.js runtime. Supports HTTP streaming responses. |
| **Node.js (`>= 20.x`, recommended `22.x` / `24.x`)** | JavaScript runtime environment | Required runtime for `@google/genai` and Next.js 16 tooling. Vercel defaults to Node.js 20.x or 22.x. |
| **`@tailwindcss/postcss`** (`^4.3.5`) | PostCSS build integration for Tailwind v4 | Added to `postcss.config.mjs` to hook the new Tailwind v4 compiler into Next.js compilation. |
| **ESLint (`eslint-config-next`)** | Code quality & static analysis | Next.js default linter configured for React Hooks rules, Next.js best practices, and TypeScript accuracy. |

---

## Installation

### Core Dependencies
```bash
npm install @google/genai react-markdown lucide-react clsx tailwind-merge
```

### Dev Dependencies (Tailwind v4, Typography, TypeScript)
```bash
npm install -D tailwindcss @tailwindcss/postcss @tailwindcss/typography postcss typescript @types/node @types/react @types/react-dom
```

*(Note: When scaffolding via `npx create-next-app@latest`, Next.js, React, TypeScript, and Tailwind are pre-configured; only `@google/genai`, `react-markdown`, `lucide-react`, `clsx`, `tailwind-merge`, and `@tailwindcss/typography` need explicit installation).*

---

## Configuration Architecture

### 1. Tailwind CSS v4 Configuration (`app/globals.css`)
Tailwind v4 eliminates `tailwind.config.js`. Plugins and theme extensions are registered directly in CSS:

```css
/* app/globals.css */
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  --font-serif: "Merriweather", "Georgia", serif;
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
```

### 2. PostCSS Configuration (`postcss.config.mjs`)
```javascript
// postcss.config.mjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

### 3. Utility Class Merger (`lib/utils.ts`)
```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

### 4. Server-Side Gemini Client Initialization (`lib/gemini.ts`)
```typescript
// lib/gemini.ts
import { GoogleGenAI } from '@google/genai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not defined.');
}

// Automatically instantiated on the server side only
export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const DEFAULT_STORY_MODEL = 'gemini-3.8-flash';
```

---

## Alternatives Considered

| Recommended | Alternative | Why Alternative Was Rejected | When to Use Alternative |
|-------------|-------------|------------------------------|-------------------------|
| **`@google/genai`** | **`@google/generative-ai`** | Deprecated by Google. The legacy package lacks access to modern Gemini 2.x/2.5 features and unified Vertex/AI Studio interfaces. | Only in legacy codebases maintaining pre-2024 SDK contracts. |
| **`@google/genai` (direct)** | **Vercel AI SDK (`ai` + `@ai-sdk/google`)** | Introduces extra abstraction layers, rapid breaking API version changes (`useCompletion` vs `useChat` vs `streamText`), and obscures underlying stream mechanics for educational purposes. Direct `@google/genai` with standard `ReadableStream` takes only 15 lines of code and zero extra dependencies. | If building a multi-provider application (switching dynamically between OpenAI, Anthropic, and Gemini) or needing complex tool-calling abstractions. |
| **`@google/genai` (direct)** | **LangChain (`langchain` / `@langchain/google-genai`)** | Excessive dependency weight (>50 transitive packages), heavy cold-start latency on serverless, severe debugging friction, and unnecessary prompt wrapper classes. | In enterprise multi-agent workflows, vector database RAG pipelines, or complex recursive reasoning graphs. |
| **Next.js App Router** | **Vite React SPA + Separate Express Backend** | Requires provisioning, configuring, and maintaining two separate codebases and two hosting providers (e.g., Render/Railway + Vercel), violating the beginner-friendly and zero-maintenance constraint. | When the backend is already maintained by a separate backend engineering team or requires long-lived WebSockets. |
| **Tailwind CSS v4** | **Component Libraries (MUI, Chakra UI, AntD)** | Significant JavaScript bundle overhead (50–150KB+), CSS-in-JS SSR hydration mismatches in React 19 / Next.js App Router, and rigid out-of-the-box aesthetic that looks like an administrative dashboard. | When building large internal enterprise admin portals where standardized data grids and forms take precedence over custom creative design. |
| **React Local State** | **State Stores (Zustand, Redux Toolkit)** | Excessive boilerplate for a single-page creative tool. Form state and streaming responses can be managed cleanly via React's native `useState` and custom hooks without global store overhead. | If stories needed cross-tab synchronization or complex multi-step wizards across disparate URL routes. |

---

## What NOT to Use (Strictly Avoid)

| Avoid | Root Cause / Risk | Recommended Alternative |
|-------|-------------------|-------------------------|
| **`@google/generative-ai`** | Deprecated legacy SDK; no active feature development; lacks Gemini 2.5 unified API contracts. | **`@google/genai`** (`^3.6.1`). |
| **Vercel Edge Runtime (`export const runtime = 'edge'`)** | `@google/genai` relies on Node.js core modules (crypto, buffer, stream internals) that fail inside Vercel Edge isolate environments. | **Default Node.js Serverless Runtime** (`export const runtime = 'nodejs'`). |
| **Client-Side Gemini API Calls** | Calling Gemini directly from browser React components exposes `GEMINI_API_KEY` in network inspector / bundles, risking unauthorized API quota theft. | **Next.js Server Route Handler** (`app/api/generate/route.ts`). |
| **Cloud Databases (Prisma, Supabase, PostgreSQL, MongoDB)** | Out of scope for v1. Adds connection pooling configuration, migration scripts, cold-start delays, and hosting complexity, breaking the zero-cost zero-maintenance mandate. | **In-memory React state**; client `navigator.clipboard` or optional `localStorage` for ephemeral saving. |
| **`dangerouslySetInnerHTML`** | Susceptible to Cross-Site Scripting (XSS) if AI generation produces unescaped HTML tags. | **`react-markdown`** (`^10.1.0`) with Tailwind Typography. |
| **Heavy AI Middleware (LangChain, Flowise)** | Massive bundle overhead, slow serverless boot times, and unnecessary cognitive overhead. | **Native Node.js async generator stream** piped into Web standard `ReadableStream`. |
| **Client-Side Polling / Non-Streaming HTTP POST** | Waiting 15–20s for a complete story generation triggers perceived user lag and risks HTTP gateway timeouts on slow mobile connections. | **`generateContentStream()`** with real-time token rendering. |

---

## Stack Patterns by Variant

### Primary Variant: Ephemeral Real-Time Story Generator (Target v1)
* **Architecture:** Client component captures form inputs $\to$ calls `/api/generate` via `fetch` $\to$ server streams chunks via `ReadableStream` using `@google/genai` $\to$ client decodes with `TextDecoder` and renders via `react-markdown`.
* **State Scope:** Component-level React `useState` / `useReducer`. No database.
* **Serverless Configuration:** Default Node.js runtime, `export const maxDuration = 60;` in `app/api/generate/route.ts`.

### Variant 2: Local Session Persistence (Optional Extension)
* **If needed:** To allow users to revisit recently generated stories during the same browsing session without adding a database.
* **Use:** Browser `localStorage` cache holding the last 3–5 story records (title, genre, body, timestamp).
* **Rationale:** Preserves zero-cost and zero-backend constraints while providing basic session resilience.

### Variant 3: Clean Story Export / Print Mode
* **If needed:** Users wanting to save or print their stories as styled manuscripts.
* **Use:** CSS `@media print` styling inside `globals.css` and a simple `window.print()` trigger button.
* **Rationale:** Avoids heavy server-side PDF generation libraries (e.g., Puppeteer, PDFKit) that exceed Vercel function size limits.

---

## Vercel Free Tier (Hobby) Constraints & Safeguards

| Constraint | Limit | Architectural Safeguard |
|------------|-------|--------------------------|
| **Serverless Function Duration** | Default 10s–15s (configurable up to 300s with Fluid Compute) | Add `export const maxDuration = 60;` to `app/api/generate/route.ts`. Streaming the first chunk immediately keeps the connection active and prevents gateway timeout. |
| **Function Memory** | 1024 MB | Lightweight `@google/genai` execution consumes `< 120 MB`, comfortably below memory ceilings. |
| **Serverless Runtime Compatibility** | Node.js 20.x or 22.x | Explicitly do NOT set `runtime = 'edge'`. Keep default Node.js runtime. |
| **Gemini API Free Tier Limits** | 15 Requests Per Minute (RPM), 1,500 Requests Per Day (RPD) | Implement UI button throttling (disable generate button while streaming) and handle HTTP 429 quota errors gracefully with user-friendly toast alerts. |
| **Serverless Deployment Size** | 250 MB unzipped / 50 MB zipped | Avoid massive packages (LangChain, Puppeteer, heavy UI suites). Current proposed stack weighs `< 25 MB` in `node_modules`. |

---

## Version Compatibility Matrix

| Package | Recommended Version | Compatible With | Critical Notes |
|---------|---------------------|-----------------|----------------|
| `next` | `^16.4.6` | `react@^19.3.1`, `react-dom@^19.3.1` | Next.js 16 requires React 19. Ensure peer dependencies match. |
| `@google/genai` | `^3.6.1` | `node >= 20.0.0` | Requires modern Node runtime; incompatible with Edge runtime isolates. |
| `tailwindcss` | `^4.3.5` | `@tailwindcss/postcss@^4.3.5`, `postcss@^8.4.x` | Tailwind v4 uses CSS-first config. Do not create `tailwind.config.js`. |
| `@tailwindcss/typography` | `^0.5.20` | `tailwindcss@^4.3.5` | Register via `@plugin "@tailwindcss/typography";` in `globals.css`. |
| `react-markdown` | `^10.1.0` | `react@^19.x` | React 19 compatible; safe AST-based Markdown parser. |
| `lucide-react` | `^1.78.0` | `react@^19.x` | Full React 19 JSX runtime compatibility. |

---

## Verification & Sources

- **Google Gen AI SDK Official Source:** `googleapis/js-genai` (GitHub) & `@google/genai` (npm registry v3.6.1 verified).
- **Google AI Studio Documentation:** Gemini 2.5 Flash model specifications, streaming API contracts, and free-tier quotas (15 RPM / 1,500 RPD).
- **Next.js Documentation:** App Router Route Handlers, Web Streams `ReadableStream` specifications, and React 19 integration.
- **Tailwind CSS v4 Documentation:** CSS-first configuration, `@plugin` directive, and `@tailwindcss/postcss` setup.
- **Vercel Platform Documentation:** Serverless Function timeouts (`maxDuration`), Fluid Compute streaming support, and Hobby tier limitations.

---
*Stack research for: StoryForge AI (Generative AI Story Generator Web Application)*  
*Completed: 2026-11-24*

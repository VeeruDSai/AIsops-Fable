# AIsop's Fables

AIsop's Fables turns a few characters, a genre, and a premise — or nothing at all — into a complete four-part story streamed live into a book-like reader. It runs entirely on free tiers: Vercel Hobby for hosting and the Google Gemini free tier for generation, with no database, no accounts, and no cost.

## Features

- **Live streaming stories** — text appears as the model writes it through a server-side streaming route.
- **Story configuration** — up to 5 characters with optional roles, 8 genres, and an optional premise.
- **Surprise Me** — one click generates a fully randomized story without touching the form.
- **Regenerate** — replays the last request (including Surprise Me mode) without retyping anything.
- **Reader canvas** — Markdown rendering with storybook typography, Copy Story with confirmation, and Print / Save PDF.
- **Graceful fallbacks** — the server walks a model fallback chain before failing, and rate-limit errors return friendly messages.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · `@google/genai` · `react-markdown` · Vitest

## Local setup

Prerequisites: Node.js 20 or newer (22 recommended) and a free Gemini API key from [Google AI Studio](https://aistudio.google.com/).

```bash
# 1. Install dependencies
npm install

# 2. Create your local environment file
cp .env.example .env.local

# 3. Add your key to .env.local
#    GEMINI_API_KEY=your_actual_key_here

# 4. Start the dev server
npm run dev
```

Open <http://localhost:3000>.

`GEMINI_API_KEY` is read only inside the server route (`src/app/api/generate/route.ts`), so it never reaches the browser bundle. Never prefix it with `NEXT_PUBLIC_`, and never commit `.env.local`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Production build (also runs TypeScript checks) |
| `npm start` | Serve the production build |
| `npm test` | Run the Vitest suite (all Gemini calls are mocked) |

## Deploy to Vercel (Hobby)

1. Push this repository to GitHub.
2. In Vercel, choose **Add New → Project** and import the repository. Framework detection selects Next.js automatically; leave the build command (`npm run build`) and output defaults untouched.
3. Under **Settings → Environment Variables**, add `GEMINI_API_KEY` with your key for the Production (and Preview, if you want) environments. Do not add `NEXT_PUBLIC_`.
4. Deploy. No other configuration is required — `next.config.ts` and `postcss.config.mjs` are already committed.
5. Verify streaming in production: open the deployed URL, click **Surprise Me**, and confirm story text appears progressively rather than all at once.

### Deployment notes

- The generate route exports `runtime = 'nodejs'` because `@google/genai` needs Node.js APIs; the Edge runtime is not supported.
- It also exports `maxDuration = 60` and sends anti-buffering headers (`X-Accel-Buffering: no`, `Cache-Control: no-cache, no-transform`). This requires Fluid Compute on Vercel, which is the default for new Hobby projects. If a deployment still buffers, check that the project is not pinned to an older function configuration.
- The Gemini free tier allows roughly 15 requests per minute. The UI disables generate, Surprise Me, Regenerate, and Reset while a request streams to stay inside that budget; a 429 shows a friendly "rate limit reached" message instead of a raw error.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "Server environment missing GEMINI_API_KEY" | Add `GEMINI_API_KEY` to `.env.local` (local) or the project's environment variables (Vercel), then restart/redeploy. |
| "Rate limit reached" | The free-tier quota is exhausted for the moment. Wait and try again, or use another key. |
| Story never starts in production | Confirm the deployment uses the Node.js runtime and that no proxy is buffering the response. |
| Tests fail with network calls | The suite mocks `@google/genai`; run `npm test` without a live key — no outbound requests are made. |

## Project layout

```
src/app/page.tsx                 Page shell and header
src/app/api/generate/route.ts    Streaming Gemini route (Node.js runtime)
src/components/StoryForm.tsx     Configuration form, Surprise Me, Reset
src/components/StoryDisplay.tsx  Reader canvas, Copy Story, Print, Regenerate
src/hooks/useStoryGeneration.ts  Fetch + stream orchestration, replay, reset
src/lib/prompts.ts               Prompt construction and input sanitization
src/lib/gemini.ts                Client init, fallback chain, error mapping
```

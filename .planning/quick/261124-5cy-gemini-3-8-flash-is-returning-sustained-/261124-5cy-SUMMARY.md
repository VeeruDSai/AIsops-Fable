---
quick: 261124-5cy
task: "Add automatic Gemini model fallback with clean 503/404/429 error handling"
status: complete
date: 2026-11-24
commits: [42b7de8]
---

# Quick Task 261124-5cy Summary

**Added pre-stream Gemini model fallback so sustained 503/404 failures recover transparently, with clean friendly JSON when all models fail.**

## Changes

- `src/lib/gemini.ts` now exports `FALLBACK_MODEL_CHAIN` with exactly `['gemini-3.8-flash', 'gemini-3.8-flash-lite', 'gemini-2.5-flash-lite']`, keeps `DEFAULT_STORY_MODEL` pointing at the first entry, and adds `parseGeminiError` / `getFriendlyGeminiError` helpers that classify nested SDK errors without serializing raw JSON.
- `src/app/api/generate/route.ts` wraps only the `await ai.models.generateContentStream(...)` call in a fallback loop. 503 and 404 errors retry the next model before any text streams; 429, unknown errors, and non-retryable failures return immediately with static `ApiErrorResponse` bodies; exhaustion returns HTTP 503 with the high-demand message.
- Mid-stream behavior is untouched: no stream that already emitted text is restarted, safety/429 in-band notices and abort wiring remain intact, and all streaming headers are preserved.
- `tests/api/generate.test.ts` adds a hoisted mock handle plus tests for fallback-on-503, retry-on-404, all-models-fail-503, and 429 stopping the chain.

## Verification

- `npm test` — 32/32 tests passed (11 in `tests/api/generate.test.ts`).
- `npx tsc --noEmit` — passed.
- `npm run build` — passed (Next.js 16.4.6).
- Code committed separately from planning artifacts in `42b7de8`.

## Notes

- The configured `gsd-executor` model (`opencode/deepseek-v4-flash-free`) remains unavailable, so the quick plan was executed inline with the same atomic-commit and state-tracking guarantees.
- ROADMAP.md was intentionally not modified; quick tasks are tracked in STATE.md only.

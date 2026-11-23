---
phase: 02-narrative-prompt-engine-intelligent-fallback-generation
plan: 01
subsystem: generation
tags: [prompts, fallback, structured-output, prompt-injection, gemini, streaming]

requires:
  - phase: 01-foundation-serverless-streaming-route
    provides: Serverless Gemini streaming route, secure client factory, story request types
provides:
  - Narrative prompt engine with structured Markdown story contract
  - Intelligent fallback inference for empty, partial, and surprise-mode requests
  - Boundary sanitization for untrusted character, genre, and premise inputs
  - Gemini system instruction enforcing title, beginning, middle, climax, and conclusion
  - Offline Vitest coverage for prompt generation and route prompt wiring
affects: [03-story-configuration-character-builder, 04-story-reader-canvas, 05-story-regeneration-surprise-mode]

actuals:
  tokens: 25000
  tasks: 2
  commits: 0

tech-stack:
  added: []
  patterns: [Pure prompt-builder function, XML-style input boundaries, fallback directives, systemInstruction separation]

key-files:
  created:
    - src/lib/prompts.ts
    - tests/prompts.test.ts
  modified:
    - src/app/api/generate/route.ts
    - tests/api/generate.test.ts

key-decisions:
  - "Kept prompt construction in a pure TypeScript function so prompt behavior can be tested without Gemini API calls"
  - "Placed all user-provided story ingredients inside a single <user_inputs> boundary and strip angle brackets from inputs"
  - "Used missing-field directives so empty or partial requests still instruct Gemini to invent coherent characters, genre, and premise"
  - "Passed STORY_SYSTEM_INSTRUCTION through the @google/genai config instead of mixing system rules into the user prompt"
  - "Preserved all Phase 1 streaming, abort, anti-buffering, and rate-limit behavior without rewriting the route"

patterns-established:
  - "Narrative structure is enforced as Markdown headings rather than JSON, keeping streaming display simple and resilient"
  - "Prompt-injection defense combines input truncation, markup removal, boundary tags, and explicit untrusted-content instructions"

requirements-completed:
  - GENR-01
  - GENR-03
  - GENR-04

coverage:
  - id: D1
    description: "Full character, genre, and premise inputs are incorporated into the structured prompt"
    requirement: GENR-01
    verification:
      - kind: unit
        ref: "tests/prompts.test.ts#incorporates full character, genre, and premise inputs"
        status: pass
    human_judgment: false
  - id: D2
    description: "Partial and empty inputs activate intelligent creative fallback directives"
    requirement: GENR-01
    verification:
      - kind: unit
        ref: "tests/prompts.test.ts#activates full creative autonomy for empty requests"
        status: pass
    human_judgment: false
  - id: D3
    description: "Every generated prompt mandates title, beginning, middle, climax, and conclusion headings"
    requirement: GENR-03
    verification:
      - kind: unit
        ref: "tests/prompts.test.ts#always mandates the four-part Markdown structure"
        status: pass
    human_judgment: false
  - id: D4
    description: "User inputs are sanitized, truncated, and contained inside user_inputs boundaries"
    requirement: GENR-01
    verification:
      - kind: unit
        ref: "tests/prompts.test.ts#contains prompt injection attempts inside user_inputs as story material"
        status: pass
    human_judgment: false
  - id: D5
    description: "Route passes the generated prompt and system instruction into the Gemini streaming call"
    requirement: GENR-04
    verification:
      - kind: integration
        ref: "tests/api/generate.test.ts#passes full story requests through the narrative prompt engine"
        status: pass
    human_judgment: false
  - id: D6
    description: "Existing streaming, abort, anti-buffering, safety, and 429 behavior remains intact"
    requirement: GENR-04
    verification:
      - kind: integration
        ref: "tests/api/generate.test.ts"
        status: pass
    human_judgment: false

verification:
  - "npm test — 21/21 tests passed across 2 suites"
  - "npx tsc --noEmit — passed"
  - "npm run build — passed"

constraints:
  - "No Gemini API calls were made during development; all tests mock @google/genai because quota is exhausted until 2026-12-01"

duration: 15min
completed: 2026-11-24
status: complete
---

# Phase 2: Plan 01 Summary

**Implemented a structured narrative prompt engine with intelligent fallback inference, secure input boundaries, and streaming route integration**

## Accomplishments
- Created `src/lib/prompts.ts` with `STORY_SYSTEM_INSTRUCTION` and `buildStoryPrompt`.
- Enforced the required Markdown story contract: title, beginning, middle, climax, and conclusion.
- Added fallback directives for missing characters, missing genre, missing premise, empty requests, and surprise mode.
- Sanitized and truncated character names, roles, genres, and premises to prevent prompt injection and oversized payloads.
- Replaced the temporary premise-only prompt in `/api/generate` with the structured prompt engine.
- Passed the story-system instruction through `@google/genai` config while preserving Phase 1 streaming and error handling.
- Added 14 prompt unit tests and expanded route tests to verify prompt wiring; all 21 tests pass.
- Verified TypeScript compilation and the Next.js production build.

## Important Notes
- No Gemini API calls were made during development because quota is exhausted until 2026-12-01.
- Gemini integration is preserved unchanged in `src/lib/gemini.ts` and will work once quota returns.

---
*Phase: 02-narrative-prompt-engine-intelligent-fallback-generation*
*Completed: 2026-11-24*

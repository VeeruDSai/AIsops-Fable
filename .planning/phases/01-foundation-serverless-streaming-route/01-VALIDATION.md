---
phase: "1"
slug: "foundation-serverless-streaming-route"
status: ready
nyquist_compliant: true
wave_0_complete: false
created: "2026-11-24"
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest `^3.0.5` |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run tests/api/generate.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/api/generate.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | TECH-01, TECH-02 | T-01-01, T-01-02 | Vitest and Next.js dependencies verified | unit | `node -e "const pkg = require('./package.json'); if (!pkg.dependencies['@google/genai'] || !pkg.devDependencies['vitest']) process.exit(1);"` | ❌ W1 | ⬜ pending |
| 01-01-02 | 01 | 1 | TECH-01, TECH-02 | — | Next.js App Router and Tailwind v4 compilation | build | `npx next build` | ❌ W1 | ⬜ pending |
| 01-01-03 | 01 | 1 | TECH-01, TECH-02 | — | Vitest test runner CLI operational | unit | `npx vitest --version` | ❌ W1 | ⬜ pending |
| 01-02-01 | 02 | 2 | TECH-01, TECH-02 | T-01-01, T-01-04 | Route handler declares Node.js runtime and anti-buffering headers | integration | `node -e "const r = require('fs').readFileSync('src/app/api/generate/route.ts', 'utf8'); if (!r.includes('X-Accel-Buffering') || !r.includes('runtime = \'nodejs\'')) process.exit(1);"` | ❌ W2 | ⬜ pending |
| 01-02-02 | 02 | 2 | TECH-01, TECH-02 | T-01-03, T-01-05 | Full automated route handler suite: streaming, 500 missing key, 429 rate limit, anti-buffering headers, client abort | integration | `npx vitest run tests/api/generate.test.ts` | ❌ W2 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing test framework not present at start; Plan 01 Wave 1 establishes `vitest.config.ts`, `tests/setup.ts`, and installs `vitest`. Plan 02 Wave 2 creates `tests/api/generate.test.ts`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real-time live curl streaming | TECH-01, TECH-02 | Requires live internet connection and active Gemini API key | Run Next dev server (`npm run dev`), invoke `curl -N -X POST http://localhost:3000/api/generate -H "Content-Type: application/json" -d '{"prompt":"test"}'`, verify progressive chunk arrivals in terminal |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** verified

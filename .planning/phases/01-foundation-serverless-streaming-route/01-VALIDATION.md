---
phase: "1"
slug: "foundation-serverless-streaming-route"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-24"
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest `^5.1.1` |
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
| 01-01-01 | 01 | 0 | TECH-01, TECH-02 | — | Vitest and TypeScript test harness configured | unit | `npx vitest --version` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | TECH-01 | T-01-01 | Serverless Route Handler streams chunks from Gemini without leaking `GEMINI_API_KEY` | integration | `npx vitest run tests/api/generate.test.ts -t "executes Gemini streaming"` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | TECH-01 | T-01-01 | Missing `GEMINI_API_KEY` returns structured 500 JSON without process crash | unit | `npx vitest run tests/api/generate.test.ts -t "missing API key"` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | TECH-02 | T-01-02 | Anti-buffering headers present (`X-Accel-Buffering: no`, `Cache-Control: no-cache, no-transform`) | unit | `npx vitest run tests/api/generate.test.ts -t "anti-buffering headers"` | ❌ W0 | ⬜ pending |
| 01-01-05 | 01 | 1 | TECH-02 | T-01-02 | Traps Gemini `RESOURCE_EXHAUSTED` (429) before stream and returns HTTP 429 JSON | unit | `npx vitest run tests/api/generate.test.ts -t "handles 429 rate limit"` | ❌ W0 | ⬜ pending |
| 01-01-06 | 01 | 1 | TECH-02 | T-01-02 | Client disconnect signals upstream `AbortController` cleanly | unit | `npx vitest run tests/api/generate.test.ts -t "aborts on client signal"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — test configuration with path aliases (`@/*` -> `./src/*` or `./*`)
- [ ] `tests/api/generate.test.ts` — test suite covering TECH-01 and TECH-02
- [ ] Framework install: `npm install -D vitest`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real-time live curl streaming | TECH-01, TECH-02 | Requires live internet connection and active Gemini API key | Run Next dev server (`npm run dev`), invoke `curl -N -X POST http://localhost:3000/api/generate -H "Content-Type: application/json" -d '{"prompt":"test"}'`, verify progressive chunk arrivals in terminal |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

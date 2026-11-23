# Requirements: StoryForge AI

**Defined:** 2026-11-24
**Core Value:** Generate creative, coherent, and well-structured stories with beginning, middle, climax, and conclusion—even when given minimal or no user input—delivering real-time streaming feedback and seamless regeneration.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Inputs & Characters

- [ ] **INPT-01**: User can add, edit, and remove multiple characters with a name and optional role/trait
- [ ] **INPT-02**: User can select a story genre from 8 curated genres (Fantasy, Sci-Fi, Horror, Romance, Mystery, Adventure, Comedy, Thriller)
- [ ] **INPT-03**: User can provide an optional story premise or short plot description

### AI Story Generation

- [ ] **GENR-01**: User can generate a story with full, partial, or completely empty inputs, with the AI automatically and coherently inventing any missing details
- [ ] **GENR-02**: User can click a dedicated "Surprise Me" button to generate a completely randomized story without relying on form inputs
- [ ] **GENR-03**: System generates stories following a 4-part classical narrative structure: Title, Beginning, Middle, Climax, and Conclusion
- [ ] **GENR-04**: System streams story text progressively in real time as chunks arrive from Gemini API

### Reading & Story Controls

- [ ] **DISP-01**: Story displays in a clean, responsive reader canvas with formatted typography and clear narrative stage headings
- [ ] **DISP-02**: User can copy the full story text to clipboard with one click and see visual feedback (e.g. "Copied!")
- [ ] **DISP-03**: User can regenerate a new story with one click using the current or revised parameters

### Technical & Infrastructure

- [ ] **TECH-01**: Next.js App Router route handler (`/api/generate`) securely executes `@google/genai` calls server-side without exposing `GEMINI_API_KEY`
- [ ] **TECH-02**: Route handler uses standard Node.js serverless runtime with anti-buffering streaming headers and error handling for 429 rate limits
- [ ] **TECH-03**: Application builds cleanly and is configured for zero-cost deployment on Vercel free tier

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Productivity & Session Polish

- **FEAT-01**: Stop ongoing stream mid-generation via AbortController
- **FEAT-02**: Word count, reading time estimator, and genre badge metadata on story card
- **FEAT-03**: Download story as `.txt` or `.md` file
- **FEAT-04**: Browser localStorage history drawer showing the last 3 generated stories in the session
- **FEAT-05**: Story continuation / Sequel generator ("Continue this story")

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| User authentication & accounts | Adds unnecessary database and session complexity; v1 prioritizes instant, friction-free access |
| Persistent cloud database | Stories are ephemeral in v1 to ensure 100% free-tier compliance and zero hosting/maintenance cost |
| Paid AI APIs or subscriptions | Strictly constrained to Google Gemini API free tier |
| AI cover image generation | Slow generation times, strict free-tier quotas, and blob storage hosting overhead |
| Audio narration / Text-to-Speech | High API costs and audio buffering latency; deferred past v1 |
| Multi-chapter novel studio | Beyond the scope of a beginner-friendly short story generator |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INPT-01 | TBD | Pending |
| INPT-02 | TBD | Pending |
| INPT-03 | TBD | Pending |
| GENR-01 | TBD | Pending |
| GENR-02 | TBD | Pending |
| GENR-03 | TBD | Pending |
| GENR-04 | TBD | Pending |
| DISP-01 | TBD | Pending |
| DISP-02 | TBD | Pending |
| DISP-03 | TBD | Pending |
| TECH-01 | TBD | Pending |
| TECH-02 | TBD | Pending |
| TECH-03 | TBD | Pending |

**Coverage:**
- v1 requirements: 13 total
- Mapped to phases: 0
- Unmapped: 13 ⚠️ (Will be mapped in Roadmap)

---
*Requirements defined: 2026-11-24*
*Last updated: 2026-11-24 after initial definition*

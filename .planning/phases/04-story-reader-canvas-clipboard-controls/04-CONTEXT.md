# Phase 4 Context: Story Reader Canvas & Clipboard Controls

## Locked User Decisions

- Display streamed story text through `react-markdown` with Tailwind Typography `prose` classes inside a responsive reader canvas.
- The reader must render Markdown headings in real time: `# Title` plus `### Beginning`, `### Middle`, `### Climax`, and `### Resolution`. Existing prompt output may use `Conclusion`; treat `Conclusion` as an equivalent final section heading.
- `@plugin "@tailwindcss/typography";` is already present in `src/app/globals.css` and must remain.
- Add a `Copy Story` action using `navigator.clipboard.writeText` with the raw story text, showing visible confirmation (`Copied!`) that reverts automatically after a short delay.
- Add a `Print / Save PDF` action using `window.print()`, with print CSS that hides the configuration form and all reader controls so only the story prints.
- Do not add backend generation, regeneration, or surprise-mode logic; those belong to Phase 5.
- Preserve the existing streaming behavior in `useStoryGeneration` (`storyText`, `isLoading`, `error`, `abort`) and keep the current request lifecycle, abort wiring, and control locking intact.
- Keep the reader accessible: retain polite live-region behavior for streamed text and use accessible buttons/labels for reader actions.
- Follow `AGENTS.md`: read relevant Next.js docs under `node_modules/next/dist/docs/` before writing code.

## Scope Fences

- In scope: reader canvas, Markdown rendering, typography, copy-to-clipboard, print-to-PDF affordance, print stylesheet, tests, and GSD artifacts.
- Out of scope: regeneration, surprise mode, API changes, model changes, authentication, persistence, and deployment.

## Success Criteria

- Story displays in a clean, responsive reader canvas with book-like typography and distinct narrative stage headings.
- Full story text can be copied in one click.
- Copy confirmation appears immediately and reverts automatically.
- Print/Save PDF hides non-story UI and produces a readable print layout.

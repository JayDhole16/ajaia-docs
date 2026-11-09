# AI Workflow Note

## Tools used
- **Claude Code (Claude Opus 5.5)** in VS Code was the primary implementation agent. It inspected the repo, proposed the plan, wrote the code, tests, and docs, and ran lint, typecheck, test, and build loops.
- Project instructions (`CLAUDE.md`, `00-MASTER-PROMPT.md` … `07-FINAL-CHECKLIST.md`) defined scope, stack, and the definition of done, and steered the agent.

## How the work was split
- **Human decisions:** the overall scope, the stack, the hosting and database choice (Vercel + Neon Postgres, chosen from options the agent laid out with their tradeoffs), deployment access, and final acceptance.
- **AI-accelerated work:** scaffolding, the Prisma schema, the service and authorization layer, the TipTap editor and autosave, the Markdown converter, the test suite, and documentation.
- **Plan first:** the agent wrote an architecture and risk plan (current state, architecture, highest-risk decisions, ordered steps) before writing code. I approved it before implementation started. The highest-risk items (the DB pipeline and the authorization model) were built and verified first.

## What was changed or rejected during the build
Concrete cases where the first output, a tool default, or a first assumption was wrong and got corrected:

| Issue found | What was done instead |
|---|---|
| npm's `latest` tag for Prisma resolved to an **8.0 release candidate** | Pinned the stable Prisma 6.19.3. No RC dependencies in a graded deliverable. |
| `create-next-app` pinned `@types/node@^20`, which conflicted with Vitest 5's peer range | Aligned types with the Node 22 runtime instead of installing with `--force`/`--legacy-peer-deps` |
| The Next 16.4 scaffold enabled **Cache Components** by default, which needs `<Suspense>` around every session read | Turned it off on purpose. Every page is per-user and dynamic, so the simpler rendering model is easier to explain and has no real downside here. |
| Error boundary written with `reset()`, from older Next.js knowledge | Next 16.4's bundled docs say `retry()` re-fetches while `reset()` only re-renders, so it was switched to `retry()` |
| Toolbar picked shortcut labels by checking `navigator.platform` at module load | That would cause an SSR hydration mismatch, so it now uses a fixed "Ctrl/⌘" label |
| The upload button imported a helper from the parser module | That would have shipped the Markdown parser (`marked`) to the browser, so a tiny `fileType.ts` was split out |
| Upload limit (1 MB) equaled the content limit (1 MB) | Converted JSON is bigger than the source text, so a valid upload could fail to save. Now uploads are capped at 500 KB, content at 1.5 MB, and the action body at 2 MB. |
| Inline `code` combined with bold or italic marks during Markdown import | TipTap's code mark excludes other marks, so code spans now get the code mark alone |
| Env var named `DIRECT_URL` (a common Prisma convention) | Renamed to `DATABASE_URL_UNPOOLED`, which is what Vercel's Neon integration injects. Production needs no manual DB env setup. |
| A test expected `".md"` to become the default title | The code was right (a leading-dot name is a dotfile with no extension) and the test was wrong, so the test was fixed |
| Integration-test migration hook timed out at Vitest's 10 s default | Gave the hook an explicit 120 s timeout instead of raising timeouts globally |

### Bugs caught by the browser E2E test (after unit tests, typecheck and build had all passed)
| Bug | Root cause and fix |
|---|---|
| **Autosave failed on any document with a heading or list** ("expected record, received function") | ProseMirror's `attrs` objects arrived on the server as functions after going through React's server-action argument encoding. The unit tests used hand-written JSON, and the schema accepted real ProseMirror output, so only a real browser exposed it. Fix: the editor sends `JSON.stringify(doc)` and the action checks the size, then `JSON.parse`es and Zod-validates it. |
| **Toolbar disabled until the first keystroke** | With `immediatelyRender: false` the editor starts as `null`, and `useEditorState` only recomputes on transactions. Fix: mount the toolbar once the editor exists. Covered by a regression assertion in the E2E test. |

### Deployment issues found and fixed
- The first `vercel --prod` uploaded the local `.env`. Vercel's env vars took precedence, so production never used it, but it shouldn't ship. Added `.vercelignore` and rotated the local dev secret.
- The Neon integration's DB URLs are marked sensitive, so `vercel env pull` returns them empty. Rather than copying production credentials to a laptop, the idempotent seed now runs inside the Vercel build.

Rejected outright: a `.docx` importer (unreliable in the timebox), realtime collaboration, and an auth library (seeded users and a signed cookie are enough for a demo, and the code is easier to read).

## How AI output was verified
- **Typecheck + lint:** `tsc --noEmit` (strict) and ESLint, clean.
- **Automated tests (22):** a permission-matrix unit test, Markdown/text import and file-validation tests (including `javascript:` links, raw HTML, binary and non-UTF-8 files), schema and session-tampering tests, and a **real-Postgres integration test** of the authorization and persistence rules through the actual service layer.
- **HTTP smoke tests:** signed session cookies for each demo user against the running server. Anonymous users get redirected, Alice sees owner controls, Bob sees the shared doc without owner controls, Carol gets "not available" with no title or content leaked, and forged cookies are rejected.
- **Browser E2E (Playwright, real Chrome):** the full reviewer walkthrough, run locally and against the live URL. This caught two bugs that every other check had missed (see above). The lesson: green unit tests and a clean build didn't prove the editor worked.
- **Mobile check:** screenshots at 390 px width of the live site, with no horizontal overflow.
- **Production build** (`next build`) passes, and Vercel production builds pass with migrations applied to Neon.

## Engineering judgment
AI wrote most of the code quickly. Its output was still treated as a draft to verify: checked against the installed library versions' own docs and types (Next 16.4, TipTap 3, marked 18), exercised by tests, and corrected where it was wrong. The architecture, scope cuts, security model, and final acceptance stayed under human control.

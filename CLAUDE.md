# AJAIA AI-Native Full Stack Developer Assignment

## Mission
Build and ship the strongest focused collaborative document editor possible within the assessment timebox. Optimize for:
1. Working end-to-end product
2. Clean UX
3. Correct persistence and sharing
4. Clear engineering judgment
5. Reliable deployment
6. Honest documentation of AI usage and tradeoffs

## Default stack
- Next.js App Router + TypeScript
- Tailwind CSS
- TipTap editor
- Prisma ORM
- SQLite for local development / simple production-compatible persistence, unless deployment constraints make another free hosted DB clearly better
- Zod for validation
- Vitest for at least one meaningful automated test
- Vercel for deployment if compatible with chosen persistence; otherwise use a free hosted PostgreSQL provider
- Do not introduce unnecessary libraries.

## Product scope
Must work:
- Create document
- Rename document
- Rich-text editing: bold, italic, underline, headings, bullet list, ordered list
- Save/reopen
- File upload/import for .txt and .md; optionally .docx only if reliable within timebox
- Owner + share with another seeded user
- Owned/shared document views
- Persistence
- Validation/error/loading/empty states
- One meaningful automated test
- Production deployment
- README, architecture note, AI workflow note, SUBMISSION.md
- 3-5 minute walkthrough

## Scope discipline
Do NOT build:
- real-time collaboration
- comments
- complex permissions
- Google Docs parity
- elaborate auth
- unnecessary microservices
unless all core requirements are already solid.

## Engineering rules
- TypeScript strict mode.
- Validate server inputs with Zod.
- Keep database access isolated.
- Prefer server actions or API routes consistently; do not mix patterns randomly.
- Never expose secrets in client code.
- Handle optimistic UI carefully; do not fake persistence.
- Provide useful error messages.
- Avoid overengineering.
- Every feature should be testable.
- Run lint, typecheck, tests, and production build before declaring done.
- Fix root causes rather than suppressing errors.

## AI usage
AI is allowed and expected. Use it for acceleration, not blind acceptance.
For every major AI-generated implementation:
1. inspect it,
2. test it,
3. correct it,
4. document material changes/rejections.

## Definition of done
The app can be cloned, installed, configured, run, and demonstrated by a reviewer with minimal friction. A fresh reviewer can understand the product and test sharing within 2-3 minutes.

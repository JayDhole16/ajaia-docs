# Ajaia Docs — a lightweight collaborative document editor

Built for the Ajaia AI-Native Full Stack Developer assignment. Users sign in as a seeded demo account, create and edit rich-text documents, import `.txt` / `.md` files, and share documents with other users.

**Live:** https://ajaia-docs-lac.vercel.app · **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md) · **AI workflow:** [AI_WORKFLOW.md](AI_WORKFLOW.md)

## Demo accounts

All accounts use the password **`demo1234`**. They're also listed on the login page, and clicking one fills in the form.

| User | Email | Seeded state |
|---|---|---|
| Alice Owner | `alice@demo.test` | Owns "Team kickoff notes", already shared with Bob |
| Bob Collaborator | `bob@demo.test` | Sees Alice's doc under **Shared with me** |
| Carol Outsider | `carol@demo.test` | No access to Alice's doc (use her to check authorization) |

**2-minute sharing test:** sign in as Alice, open a doc, click **Share**, and pick Carol. Sign out, sign in as Carol, and the doc appears under **Shared with me**. Carol can edit it but can't rename, share, or delete it. Open a document URL that wasn't shared with you and you get "Document not available".

## Features

- **Documents:** create, rename (inline title; Enter/blur saves, Esc reverts), delete with confirmation.
- **Rich text (TipTap):** bold, italic, underline, H1–H3, bulleted and numbered lists, undo/redo, plus keyboard shortcuts.
- **Saving:** debounced autosave (~0.8 s) and Ctrl/⌘+S. The indicator reads *Unsaved → Saving… → All changes saved*, or *Not saved* with a Retry button. "Saved" only appears after the server confirms. The browser warns you before closing a tab with unsaved changes.
- **File import:** `.txt`, `.md`, `.markdown`, up to **500 KB**, UTF-8. Each import becomes a new document you own. Markdown headings, emphasis, lists, quotes, code, and links are converted to editor formatting. Sample files are in [`samples/`](samples).
- **Sharing:** the owner shares with any other user and can remove access. Shared users can **edit content**. Only the owner can rename, share, or delete.
- **Owned vs shared:** the sidebar has **My documents** and **Shared with me** views with counts. Each document shows badges: *Private*, *Shared with N*, *Owner: Alice*, or *Shared with you by Alice*.
- **Validation and states:** Zod on every server input, plus empty, loading, error, and not-found states. The layout is responsive, with keyboard-accessible dialogs and toolbar.

## Tech stack

Next.js 16 (App Router, Server Actions) · TypeScript (strict) · Tailwind CSS 4 · TipTap 3 · Prisma 6 · PostgreSQL (Docker locally, Neon in production) · Zod 4 · Vitest · Vercel

## Local setup

Requires **Node 20.9+** and **Docker** (for Postgres). If you don't want Docker, any Postgres URL works, including a free Neon database.

```bash
npm install                 # also runs `prisma generate`
cp .env.example .env        # defaults match docker-compose; set SESSION_SECRET
npm run db:up               # start Postgres in Docker (creates ajaia + ajaia_test DBs)
npm run db:migrate          # apply migrations (and seeds demo users the first time)
npm run db:seed             # idempotent; safe to re-run
npm run dev                 # http://localhost:3000
```

### Environment variables

| Name | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection used by the app (Neon: the **pooled** URL) |
| `DATABASE_URL_UNPOOLED` | Direct connection used by Prisma migrations (Neon: the unpooled URL) |
| `SESSION_SECRET` | ≥ 32 random characters, used to sign session cookies |
| `TEST_DATABASE_URL` | Optional. A separate DB for the integration test, which **wipes** it |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types + `tsc --noEmit` |
| `npm test` | Vitest: unit tests plus a Postgres integration test (skipped if `TEST_DATABASE_URL` is unset) |
| `npm run test:e2e` | Playwright walkthrough in your installed Chrome. Needs the app running. `E2E_BASE_URL=<url>` targets another deployment. |
| `npm run build` | Production build |
| `npm run db:reset` | Drop, re-migrate, and re-seed the local DB |

### Tests

- `tests/documents.integration.test.ts` runs against a real Postgres database through the actual service layer. It checks that outsiders can't read or modify a document, that shared users can edit but not rename, delete, or re-share, that duplicate and self shares are rejected, that unsharing revokes access, and that content round-trips unchanged.
- `tests/access.test.ts` covers the full permission matrix.
- `tests/import.test.ts` covers Markdown/text conversion, unsafe links and HTML, and file validation (type, size, empty, binary, non-UTF-8).
- `tests/validation.test.ts` covers content schema limits, titles, and session token tampering and expiry.
- `e2e/walkthrough.spec.ts` runs the whole reviewer flow in a real browser: log in, create, format, reload, rename, import, share, collaborator edit, outsider denied, delete. It cleans up after itself, so it can run against production.

## Deployment (Vercel + Neon)

1. `vercel link`, then add the **Neon** integration to the project from the Vercel dashboard (Storage → Create → Neon). This injects `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.
2. `vercel env add SESSION_SECRET production`
3. `vercel --prod`. `vercel.json` pins the build command to `npm run vercel-build`, which is `prisma generate && prisma migrate deploy && prisma db seed && next build`. Migrations and demo-user seeding happen during the build, so no production credentials are needed locally. The integration's DB URLs are marked sensitive and can't be pulled anyway. The seed is idempotent: upserts, it never resets passwords, and it only creates welcome docs for users who have none.
4. `.vercelignore` keeps local `.env` files out of CLI uploads.

## Known limitations

- **No real-time collaboration.** Concurrent edits are last-write-wins: two people editing the same document at the same moment overwrite each other's latest save. Saves are serialized per tab, so a single user never loses edits.
- **Demo authentication only.** Accounts are seeded and there's no sign-up or password reset. Sessions are HMAC-signed httpOnly cookies, valid for 7 days.
- **Single sharing role.** Shared users can always edit; there's no viewer or commenter role.
- **Import only.** No `.docx` import and no export.
- A document URL you can't access shows the "not available" page but returns HTTP 200, not 404. That's because the route streams behind a loading skeleton. No document data is sent.

# Architecture

## Goal
A focused document editing and sharing product that works reliably end-to-end. It is not an attempt at Google Docs parity. Every choice favors fewer moving parts that a reviewer can run and reason about quickly.

## Overview

```text
Browser
  │  React client components: TipTap editor, toolbar, share/delete dialogs, upload
  │  (call Server Actions; never touch the DB)
  ▼
Next.js App Router (Vercel, Node runtime)
  ├─ Server Components (reads)    app/(app)/documents/page.tsx, documents/[id]/page.tsx
  ├─ Server Actions  (all writes) src/actions/{auth,documents}.ts
  │     requireUser() → Zod parse → service call → revalidatePath
  ▼
Service layer (server-only)       src/server/
  ├─ session.ts    signed-cookie session, getCurrentUser / requireUser
  ├─ access.ts     PURE policy: resolveRole() + can()
  ├─ documents.ts  every query scoped to the acting user; authorize() gate
  └─ db.ts         Prisma client singleton
  ▼
Prisma 6 ──► PostgreSQL (Docker locally · Neon in production)
```

There is one pattern for every operation. Reads happen in Server Components and writes go through Server Actions. There are no API routes. Prisma is imported only under `src/server/`.

## Data model

```text
User     id · name · email (unique) · passwordHash · createdAt
Document id · title · content (JSON) · ownerId → User · createdAt · updatedAt
Share    id · documentId → Document (cascade) · userId → User (cascade) · createdAt
         unique(documentId, userId)
```

Indexes: `Document(ownerId, updatedAt)` for the owned list and `Share(userId)` for the shared list.

## Authorization

| Action | Owner | Shared user | Anyone else |
|---|---|---|---|
| Read / edit content | ✓ | ✓ | "not found" |
| Rename / delete / share / unshare | ✓ | Forbidden | "not found" |

- The policy lives in one pure module (`src/server/access.ts`) and is unit-tested as a matrix.
- `documents.ts › authorize(userId, docId, action)` loads the document with *only the caller's* share row and applies the policy. Every service function goes through it, so a crafted request that skips the UI is still rejected.
- No access returns NOT_FOUND rather than FORBIDDEN, so the existence of a document isn't revealed.
- The UI hides owner controls for shared users, but only as a convenience. Enforcement happens on the server, and the integration test proves it.

## Sessions
`ajaia_session` is an httpOnly, SameSite=Lax, Secure (in production) cookie with the value `userId.expiresAt.HMAC-SHA256`. The server compares signatures with `timingSafeEqual`, and the user is re-loaded from the DB on every request. Passwords are hashed with Node's built-in `scrypt`, so there's no bcrypt dependency. Server Actions also get Next.js's built-in Origin/Host CSRF check.

## Editor content and persistence
- Content is stored as **TipTap/ProseMirror JSON** in a Postgres `jsonb` column. JSON round-trips formatting exactly, and unlike HTML it can be validated structurally.
- `docContentSchema` (Zod) allowlists exactly the node and mark types the editor can render and caps size at about 1.5 MB. Content is only rendered through the ProseMirror schema, never through `dangerouslySetInnerHTML`, so there's no stored-XSS path.
- **Transport:** the editor sends its JSON to the save action as a **string**. Passed as an object, ProseMirror's `attrs` arrived on the server as functions through React's server-action encoding (found by the E2E test). A string round-trips exactly, and the action checks its size before `JSON.parse`.
- **Autosave:** each edit bumps a version counter, and a save runs 800 ms after the last keystroke (or on Ctrl/⌘+S). Only one save is in flight at a time. If edits arrive mid-save, another save follows immediately. The UI shows "saved" only when the server confirms. Failures show the error with a Retry button, and there's a `beforeunload` guard.

## File import
`UploadButton` checks the extension and size in the browser for fast feedback, then calls `importDocumentAction(FormData)`. On the server, `parseUpload` is the authority:
1. Extension in `.txt/.md/.markdown`, 0 < size ≤ 500 KB
2. Strict UTF-8 decode (`TextDecoder({ fatal: true })`), reject NUL bytes (binary files) and empty text
3. `.txt` → `textToDoc`: blank lines become paragraphs, single newlines become hard breaks
4. `.md` → `markdownToDoc`: walks marked's token tree, mapping headings, emphasis, strikethrough, inline/block code, safe links, nested lists, and quotes. Tables, images, and raw HTML degrade to text. `javascript:` links are dropped.
5. The output is re-validated with the same schema as editor saves, then created as a new owned document. The user is redirected to it.

## Deployment
Vercel hosts the app and Neon hosts serverless Postgres (via the Vercel integration). `vercel-build` runs `prisma generate && prisma migrate deploy && prisma db seed && next build`, so schema migrations and demo users ship with each deploy. The app uses the pooled `DATABASE_URL` and migrations use `DATABASE_URL_UNPOOLED`. The seed is idempotent, using upserts and only creating welcome documents when a user has none. Postgres runs in every environment, so local behavior matches production.

## Key tradeoffs
| Decision | Why | Cost |
|---|---|---|
| Postgres everywhere (not SQLite locally) | One Prisma provider and identical behavior in dev and prod. SQLite can't persist on Vercel. | Local setup needs Docker or a Neon URL |
| Shared users can edit | Matches the "collaborative" brief with one role | No read-only sharing |
| Last-write-wins, no realtime | Realtime (CRDT/OT, websockets) doesn't fit the timebox | Simultaneous editors can overwrite each other |
| Seeded users + signed cookie | Reviewers test sharing in seconds | Not production auth |
| Cache Components disabled | Every page is per-user and dynamic, so the simpler model is easier to explain | No partial prerendering (not needed here) |
| JSON content, Markdown import only | Lossless and validatable | No export or `.docx` |

## Why scope was limited
The brief rewards a reliable, explainable core over feature count. I spent the time on correctness: server-side authorization with tests, honest save states, and validated imports. Comments, version history, realtime presence, granular roles, and real auth are listed as next steps in SUBMISSION.md.

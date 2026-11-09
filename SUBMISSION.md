# Ajaia Assignment Submission

## Links
- **Live product:** https://ajaia-docs-lac.vercel.app
- **Source:** https://github.com/JayDhole16/ajaia-docs
- **Walkthrough video:** PASTE_PUBLIC_VIDEO_URL_HERE

## Demo credentials
Password for all accounts: **`demo1234`**. They're also listed on the login page.

| Account | Use it to |
|---|---|
| `alice@demo.test` | Owner. Has a document already shared with Bob. |
| `bob@demo.test` | Collaborator. Sees Alice's doc under "Shared with me". |
| `carol@demo.test` | Outsider. Confirms that unshared documents are inaccessible. |

## Included
- Source code (Next.js + TypeScript), with the Prisma schema and migrations in `prisma/`
- [README.md](README.md): setup, environment variables, scripts, deployment, limitations
- [ARCHITECTURE.md](ARCHITECTURE.md): components, data model, authorization, persistence, import, tradeoffs
- [AI_WORKFLOW.md](AI_WORKFLOW.md): AI tools used, what was corrected or rejected, how output was verified
- [WALKTHROUGH.md](WALKTHROUGH.md): video script
- Test suite in `tests/`, plus sample import files in `samples/`

## Running the tests
```bash
npm run db:up && npm test     # 22 tests: unit tests + Postgres integration test
npm run lint && npm run typecheck && npm run build
npm run dev & npm run test:e2e                                  # browser walkthrough, local
E2E_BASE_URL=https://ajaia-docs-lac.vercel.app npm run test:e2e # same, against production
```

## Requirements coverage
| Requirement | Status | Where |
|---|---|---|
| Create document | DONE | "New document" button → `createDocumentAction` |
| Rename document | DONE | Inline title (owner only), `renameDocumentAction` |
| Rich text: bold, italic, underline, H1–H3, bullet and numbered lists | DONE | `src/components/editor/Toolbar.tsx` |
| Save / reopen with formatting intact | DONE | JSON in Postgres, autosave plus Ctrl/⌘+S, integration test |
| File upload / import (.txt, .md) | DONE | Upload button → `parseUpload` → new document |
| Owner + share with another user | DONE | Share dialog, `shareDocument` / `unshareDocument` |
| Owned vs shared views | DONE | Sidebar "My documents" / "Shared with me", badges |
| Server-side authorization | DONE | `src/server/access.ts` + `authorize()`, integration test |
| Validation / error / loading / empty states | DONE | Zod schemas, `error.tsx`, `loading.tsx`, empty states, inline errors |
| Automated test | DONE | `tests/` (22 Vitest tests, incl. a real-Postgres authorization test) and `e2e/walkthrough.spec.ts` (Playwright) |
| Deployment | DONE | Vercel + Neon. All 9 deploy flows plus the outsider check verified on the live URL with the E2E test. |

## Known limitations
- No real-time collaboration. Simultaneous edits to one document are last-write-wins.
- Seeded demo accounts only: no sign-up, password reset, or OAuth.
- Shared users always get edit access; there's no read-only role.
- No `.docx` import and no export.
- Inaccessible document URLs render the "not available" page with HTTP 200 instead of 404, a side effect of streaming. No data is leaked.

## Next 2–4 hours
1. **Conflict detection:** send `updatedAt` with each save and warn when someone else saved in between (optimistic concurrency) instead of silently overwriting.
2. **Viewer role:** add a `role` column on `Share` (viewer / editor), a read-only editor mode, and tests for it.
3. **CI:** GitHub Actions running lint, typecheck, Vitest (with a Postgres service), and the Playwright walkthrough against Vercel preview deployments.
4. **Export** to Markdown/HTML, plus `.docx` import via `mammoth` with a fidelity test.

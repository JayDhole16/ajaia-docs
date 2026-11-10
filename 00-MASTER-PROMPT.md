You are the lead engineer helping me complete the Ajaia AI-Native Full Stack Developer Assignment.

IMPORTANT:
- The assessment explicitly permits AI coding tools.
- Do not ask me unnecessary questions. Make reasonable assumptions and document them.
- Work in the current repository.
- Prioritize a complete, reliable product over feature count.
- Do not overengineer.
- Keep the implementation explainable to a junior engineer in an interview.
- Never claim a feature works until it has been tested.

Read the assignment requirements below and implement the product end-to-end.

PRODUCT:
A lightweight Google-Docs-inspired collaborative document editor.

REQUIRED:
1. Create document
2. Rename document
3. Edit rich text in browser
4. Save/reopen documents
5. Bold, italic, underline, headings/text-size variation, bullet and numbered lists
6. Upload at least one useful file type; prefer .txt and .md import into a new editable document
7. Owner and shared-user model
8. Share a document with another user
9. Visible distinction between owned and shared documents
10. Persistent documents and sharing
11. Validation and error handling
12. At least one meaningful automated test
13. Production deployment
14. README with local setup
15. Architecture note
16. AI workflow note
17. SUBMISSION.md
18. Walkthrough video support

RECOMMENDED STACK:
Next.js App Router + TypeScript + Tailwind + TipTap + Prisma + SQLite for local development, with a free hosted PostgreSQL database for production if needed. Zod for validation. Vitest for testing.

AUTH:
Use a lightweight seeded-user login/session model. Do not spend the timebox building enterprise auth. Make the demo credentials obvious in the README and UI.

DATA MODEL:
User
- id
- name
- email

Document
- id
- title
- content (JSON or HTML, choose the most reliable representation)
- ownerId
- createdAt
- updatedAt

Share
- id
- documentId
- userId
- createdAt
- unique(documentId,userId)

SECURITY:
A user can read a document only if they own it or have a Share record. Only the owner can rename/delete/share. Shared users can edit unless you explicitly choose read-only sharing and document that tradeoff. Do not rely only on UI hiding; enforce authorization server-side.

UX:
Build a polished, simple interface:
- sidebar for Owned / Shared
- document list
- New Document button
- Upload button
- editor toolbar
- title editing
- save state indicator
- share dialog
- empty/loading/error states
- responsive layout
- keyboard-friendly controls

FILE IMPORT:
Support .txt and .md first. Validate extension and size. Parse text into the editor. Clearly state supported types in the UI and README.

IMPLEMENTATION PROCESS:
1. Inspect repository.
2. Propose architecture and scope in a short plan.
3. Set up dependencies.
4. Build database/schema.
5. Build auth/session and seeded users.
6. Build document CRUD.
7. Build editor.
8. Build file import.
9. Build sharing.
10. Add validation and authorization.
11. Add automated tests.
12. Polish UX.
13. Run lint/typecheck/test/build.
14. Fix every blocking issue.
15. Prepare deployment.
16. Write documentation.

Do not stop after scaffolding. Continue until the core product is demonstrably working.

At each major milestone, summarize:
- what changed
- files changed
- how it was verified
- remaining risks

Start by inspecting the repository and current environment, then implement the highest-risk architecture decisions first.

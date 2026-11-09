# Walkthrough script (about 3.5 minutes)

**Setup:** two browser windows. Window A is normal; window B is incognito. Have `samples/product-brief.md` ready.

---

**0:00 — Intro (15s)**
"This is Ajaia Docs, a small collaborative document editor. I aimed for a reliable core rather than lots of features: editing, saving, importing, and sharing, with authorization enforced on the server."

**0:15 — Log in (15s)** *(Window A)*
"Auth is just seeded demo accounts. The credentials are on the login page, so a reviewer can try sharing right away. I'll sign in as Alice."

**0:30 — Create and rename (25s)**
Click **New document**. Click the title, type "Q3 planning", and press Enter.
"Only the owner can rename, and the server checks that, not only the UI."

**0:55 — Formatting (35s)**
Type a heading, apply H1. Write a sentence and make words bold, italic, and underlined. Add a bulleted list and a numbered list.
"The toolbar shows which formats are active. Watch the indicator at the top right: it goes from Unsaved to Saving to All changes saved, and it only shows saved after the server confirms the write."

**1:30 — Refresh (15s)**
Reload the page.
"Everything comes back exactly. The document is stored as TipTap's JSON, which round-trips formatting without loss."

**1:45 — Import (25s)**
Click **Upload file** and pick `product-brief.md`.
"I can import .txt and Markdown files up to 500 KB. Markdown headings, lists, emphasis, and links become real editor formatting. The server validates the type, size, and encoding, and unsafe links like `javascript:` are dropped."

**2:10 — Share (25s)**
Open **Share**, choose Bob, and click Share. Point at the "Shared with Bob" badge.
"Sharing is a row in a Share table with a unique constraint on document and user. People you share with can edit the content, but only the owner can rename, share, or delete."

**2:35 — Second user (30s)** *(Window B, sign in as Bob)*
Open **Shared with me** and show the "Owner: Alice" badge. Open the doc and edit a line.
"Bob can edit, but there's no title field, no Share button, and no Delete." Switch to window A, reload, and show Bob's edit.
"For contrast, Carol was never given access. If she opens this URL directly she sees 'not available', and the document's existence isn't revealed."

**3:05 — Architecture and a tradeoff (25s)** *(Show ARCHITECTURE.md diagram)*
"Server Components handle reads and Server Actions handle writes. Each action checks the user, validates with Zod, and calls a service layer where one `authorize()` gate applies a pure permission policy. An integration test checks those rules against a real Postgres database. The main tradeoff: there's no real-time sync, so simultaneous edits are last-write-wins. Building realtime properly would have eaten the whole timebox."

**3:30 — AI workflow and scope (20s)**
"I built this with Claude Code. It drafted the plan and most of the code, and I treated its output as a draft to check: against the docs of the installed library versions, with tests, and with a production build. AI_WORKFLOW.md lists concrete corrections. I deliberately left out comments, version history, realtime, and real authentication."

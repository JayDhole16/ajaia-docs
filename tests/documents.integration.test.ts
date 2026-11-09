/**
 * Integration test: authorization + persistence through the real service layer
 * and a real Postgres database (TEST_DATABASE_URL). This is the behaviour that
 * matters most — a user must never read or change a document they don't have
 * access to, and sharing must grant exactly the documented permissions.
 *
 * Skipped when TEST_DATABASE_URL is not set. WIPES that database's tables.
 */
import { execSync } from "node:child_process";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { DocContent } from "@/lib/validation";

const hasDb = Boolean(process.env.TEST_DATABASE_URL);

describe.skipIf(!hasDb)("documents service (integration)", async () => {
  // Imported lazily so the Prisma client picks up TEST_DATABASE_URL from setup.ts.
  const { db } = await import("@/server/db");
  const svc = await import("@/server/documents");

  let alice: string, bob: string, carol: string;

  beforeAll(() => {
    execSync("npx prisma migrate deploy", { stdio: "pipe", env: process.env });
  }, 120_000);

  beforeEach(async () => {
    await db.share.deleteMany();
    await db.document.deleteMany();
    await db.user.deleteMany();
    const mk = (name: string) =>
      db.user.create({ data: { name, email: `${name}@test.local`, passwordHash: "x" } }).then((u) => u.id);
    [alice, bob, carol] = await Promise.all([mk("alice"), mk("bob"), mk("carol")]);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  const content: DocContent = {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "hello", marks: [{ type: "bold" }] }] }],
  };

  it("persists content and formatting so a reopened document is identical", async () => {
    const { id } = await svc.createDocument(alice, { title: "Plan" });
    await svc.updateDocumentContent(alice, id, content);
    const reopened = await svc.getDocumentForUser(alice, id);
    expect(reopened.content).toEqual(content);
    expect(reopened.role).toBe("owner");
  });

  it("hides documents from users they are not shared with", async () => {
    const { id } = await svc.createDocument(alice, { title: "Secret" });
    await expect(svc.getDocumentForUser(carol, id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(svc.updateDocumentContent(carol, id, content)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(svc.renameDocument(carol, id, "pwned")).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(svc.deleteDocument(carol, id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(svc.shareDocument(carol, id, carol)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await svc.listSharedDocuments(carol)).toEqual([]);
  });

  it("lets a shared user read and edit, but not rename, delete or re-share", async () => {
    const { id } = await svc.createDocument(alice, { title: "Shared" });
    await svc.shareDocument(alice, id, bob);

    expect((await svc.getDocumentForUser(bob, id)).role).toBe("editor");
    await svc.updateDocumentContent(bob, id, content);
    expect((await svc.getDocumentForUser(alice, id)).content).toEqual(content);

    await expect(svc.renameDocument(bob, id, "Mine now")).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(svc.deleteDocument(bob, id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(svc.shareDocument(bob, id, carol)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect((await svc.getDocumentForUser(alice, id)).title).toBe("Shared");

    // Owned vs shared lists are distinct.
    expect((await svc.listSharedDocuments(bob)).map((d) => d.id)).toEqual([id]);
    expect(await svc.listOwnedDocuments(bob)).toEqual([]);
  });

  it("rejects duplicate shares and self-shares, and revokes access on unshare", async () => {
    const { id } = await svc.createDocument(alice, { title: "Doc" });
    await svc.shareDocument(alice, id, bob);
    await expect(svc.shareDocument(alice, id, bob)).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(svc.shareDocument(alice, id, alice)).rejects.toMatchObject({ code: "VALIDATION" });

    const info = await svc.getShareInfo(alice, id);
    expect(info.sharedWith.map((u) => u.id)).toEqual([bob]);
    expect(info.candidates.map((u) => u.id)).toEqual([carol]);

    await svc.unshareDocument(alice, id, bob);
    await expect(svc.getDocumentForUser(bob, id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("deleting a document removes it for shared users too", async () => {
    const { id } = await svc.createDocument(alice, { title: "Temp" });
    await svc.shareDocument(alice, id, bob);
    await svc.deleteDocument(alice, id);
    expect(await svc.listSharedDocuments(bob)).toEqual([]);
    expect(await db.share.count()).toBe(0);
  });
});

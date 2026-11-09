/**
 * Seed demo users (idempotent: safe to run repeatedly, including against prod).
 * Also creates one welcome document per user if they have none, so a reviewer
 * lands on a non-empty, already-shared workspace.
 *
 *   npm run db:seed
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { hashPassword } from "../src/server/password";
import { DEMO_PASSWORD, DEMO_USERS } from "../src/lib/demo";

const db = new PrismaClient();

const welcomeDoc = (name: string): Prisma.InputJsonValue => ({
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: `Welcome, ${name}` }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "This is a " },
        { type: "text", text: "rich-text", marks: [{ type: "bold" }] },
        { type: "text", text: " document. Try the toolbar: " },
        { type: "text", text: "italic", marks: [{ type: "italic" }] },
        { type: "text", text: ", " },
        { type: "text", text: "underline", marks: [{ type: "underline" }] },
        { type: "text", text: ", headings and lists." },
      ],
    },
    {
      type: "bulletList",
      content: ["Changes save automatically", "Use Share to give another demo user access", "Upload a .txt or .md file to import it"].map(
        (text) => ({ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text }] }] }),
      ),
    },
  ],
});

async function main() {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const users = [];
  for (const demo of DEMO_USERS) {
    // Only set the password on create, so re-seeding never resets real changes.
    const user = await db.user.upsert({
      where: { email: demo.email },
      update: { name: demo.name },
      create: { email: demo.email, name: demo.name, passwordHash },
    });
    users.push(user);
  }

  const [alice, bob] = users;
  if ((await db.document.count({ where: { ownerId: alice.id } })) === 0) {
    const doc = await db.document.create({
      data: { ownerId: alice.id, title: "Team kickoff notes", content: welcomeDoc(alice.name) },
    });
    // Pre-share Alice's doc with Bob so the "Shared with me" view is demo-able immediately.
    await db.share.create({ data: { documentId: doc.id, userId: bob.id } });
  }
  for (const user of users.slice(1)) {
    if ((await db.document.count({ where: { ownerId: user.id } })) === 0) {
      await db.document.create({
        data: { ownerId: user.id, title: `${user.name.split(" ")[0]}'s first document`, content: welcomeDoc(user.name) },
      });
    }
  }

  console.log(`Seeded ${users.length} users: ${users.map((u) => u.email).join(", ")} (password: ${DEMO_PASSWORD})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());

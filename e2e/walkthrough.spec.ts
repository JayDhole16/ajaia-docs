import { expect, test, type Browser, type Page } from "@playwright/test";

/**
 * The full reviewer walkthrough, in a real browser:
 * login → create → format → reload → rename → upload → share → shared user edits
 * → outsider denied → owner deletes (cleanup, so it is safe to run against prod).
 */
const PASSWORD = "demo1234";

async function login(browser: Browser, email: string): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/documents");
  return page;
}

const editor = (page: Page) => page.locator(".doc-content");
const saved = (page: Page) => expect(page.getByText("All changes saved")).toBeVisible();
const tool = (page: Page, name: RegExp) => page.getByRole("toolbar").getByRole("button", { name });

test("owner creates, formats, renames, imports and shares; collaborator edits; outsider is denied", async ({
  browser,
}) => {
  const stamp = Date.now().toString(36);
  const title = `E2E plan ${stamp}`;

  // 1. Login as owner
  const alice = await login(browser, "alice@demo.test");
  await expect(alice.getByRole("heading", { name: "My documents" })).toBeVisible();

  // 2. Create document
  await alice.getByRole("button", { name: /New document/ }).first().click();
  await alice.waitForURL(/\/documents\/[^/?]+$/);
  const docUrl = alice.url();
  await expect(editor(alice)).toBeVisible();
  // Regression: toolbar must be usable before the first keystroke.
  await expect(tool(alice, /^Bold/)).toBeEnabled();

  // 3. Edit with every required format
  await editor(alice).click();
  await tool(alice, /^Heading 1$/).click();
  await alice.keyboard.type("Quarterly plan");
  await alice.keyboard.press("Enter");
  await tool(alice, /^Bold/).click();
  await alice.keyboard.type("bold");
  await tool(alice, /^Bold/).click();
  await alice.keyboard.type(" and ");
  await tool(alice, /^Italic/).click();
  await alice.keyboard.type("italic");
  await tool(alice, /^Italic/).click();
  await alice.keyboard.type(" and ");
  await tool(alice, /^Underline/).click();
  await alice.keyboard.type("underlined");
  await tool(alice, /^Underline/).click();
  await alice.keyboard.press("Enter");
  await tool(alice, /^Bulleted list$/).click();
  await alice.keyboard.type("first bullet");
  await alice.keyboard.press("Enter");
  await alice.keyboard.type("second bullet");
  await alice.keyboard.press("Enter");
  await alice.keyboard.press("Enter"); // leave the list
  await tool(alice, /^Numbered list$/).click();
  await alice.keyboard.type("step one");
  await saved(alice);

  // 4. Reload: formatting persisted
  await alice.reload();
  await expect(editor(alice).locator("h1")).toHaveText("Quarterly plan");
  await expect(editor(alice).locator("strong")).toHaveText("bold");
  await expect(editor(alice).locator("em")).toHaveText("italic");
  await expect(editor(alice).locator("u")).toHaveText("underlined");
  await expect(editor(alice).locator("ul > li")).toHaveCount(2);
  await expect(editor(alice).locator("ol > li")).toHaveText(["step one"]);

  // 5. Rename (persists across reload)
  await alice.locator("#doc-title").fill(title);
  await alice.locator("#doc-title").press("Enter");
  await expect(alice.getByText("Renaming…")).toBeHidden();
  await alice.reload();
  await expect(alice.locator("#doc-title")).toHaveValue(title);

  // 7. Share with Bob
  await alice.getByRole("button", { name: /^Share/ }).click();
  const dialog = alice.getByRole("dialog", { name: "Share document" });
  await dialog.locator("#share-user").selectOption({ label: "Bob Collaborator (bob@demo.test)" });
  await dialog.getByRole("button", { name: "Share", exact: true }).click();
  await expect(dialog.getByText("Shared with Bob Collaborator.")).toBeVisible();
  await expect(dialog.getByText("bob@demo.test")).toBeVisible();
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(alice.getByText(/shared with Bob/)).toBeVisible();

  // 6. Upload / import a Markdown file
  await alice.locator('input[type="file"]').setInputFiles("samples/product-brief.md");
  await alice.waitForURL((url) => /\/documents\/[^/?]+$/.test(url.pathname) && url.href !== docUrl);
  const importedUrl = alice.url();
  await expect(alice.locator("#doc-title")).toHaveValue("product-brief");
  await expect(editor(alice).locator("h1")).toHaveText("Product brief: Ajaia Docs");
  await expect(editor(alice).locator("ol > li")).toHaveCount(3);
  await expect(editor(alice).locator("strong").first()).toHaveText("lightweight");

  // Unsupported type is rejected with a clear message
  await alice.locator('input[type="file"]').setInputFiles({
    name: "photo.png",
    mimeType: "image/png",
    buffer: Buffer.from("not really a png"),
  });
  await expect(alice.getByText(/isn't supported\. Choose a \.txt or \.md file/)).toBeVisible();

  // 8 + 9. Shared user sees and edits it, without owner controls
  const bob = await login(browser, "bob@demo.test");
  await bob.getByRole("link", { name: /Shared with me/ }).click();
  await bob.getByRole("link", { name: new RegExp(title) }).click();
  await expect(bob.getByText("Shared with you by Alice Owner")).toBeVisible();
  await expect(bob.locator("#doc-title")).toHaveCount(0);
  await expect(bob.getByRole("button", { name: /^Share/ })).toHaveCount(0);
  await expect(bob.getByRole("button", { name: "Delete" })).toHaveCount(0);
  await editor(bob).locator("ol > li").last().click();
  await bob.keyboard.press("End");
  await bob.keyboard.type(" (Bob was here)");
  await saved(bob);

  await alice.goto(docUrl);
  await expect(editor(alice)).toContainText("step one (Bob was here)");

  // Outsider cannot open it by URL
  const carol = await login(browser, "carol@demo.test");
  await carol.goto(docUrl);
  await expect(carol.getByText("Document not available")).toBeVisible();
  await expect(carol.getByText("Quarterly plan")).toHaveCount(0);

  // Cleanup via the delete flow (owner only)
  for (const url of [docUrl, importedUrl]) {
    await alice.goto(url);
    await alice.getByRole("button", { name: "Delete" }).click();
    await alice.getByRole("dialog").getByRole("button", { name: "Delete" }).click();
    await alice.waitForURL("**/documents");
  }
  await bob.goto(docUrl);
  await expect(bob.getByText("Document not available")).toBeVisible();
});

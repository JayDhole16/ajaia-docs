import { describe, expect, it } from "vitest";
import { can, resolveRole, type DocumentAction } from "@/server/access";

const doc = { ownerId: "alice", shares: [{ userId: "bob" }] };

describe("resolveRole", () => {
  it("identifies the owner, shared users and outsiders", () => {
    expect(resolveRole(doc, "alice")).toBe("owner");
    expect(resolveRole(doc, "bob")).toBe("editor");
    expect(resolveRole(doc, "carol")).toBeNull();
  });
});

describe("can", () => {
  const matrix: Record<DocumentAction, [owner: boolean, editor: boolean, none: boolean]> = {
    read: [true, true, false],
    edit: [true, true, false],
    rename: [true, false, false],
    delete: [true, false, false],
    share: [true, false, false],
  };

  for (const [action, [owner, editor, none]] of Object.entries(matrix) as [DocumentAction, boolean[]][]) {
    it(`${action}: owner=${owner} editor=${editor} none=${none}`, () => {
      expect(can("owner", action)).toBe(owner);
      expect(can("editor", action)).toBe(editor);
      expect(can(null, action)).toBe(none);
    });
  }
});

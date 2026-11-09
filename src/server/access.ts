/**
 * Authorization policy — pure functions, no database access, so the rules
 * live in exactly one place and are unit-testable.
 *
 *   owner  : read, edit content, rename, delete, manage sharing
 *   editor : read, edit content (a user the document was shared with)
 *   null   : no access (treated as "not found" so existence isn't leaked)
 */
export type Role = "owner" | "editor";

export type DocumentAction = "read" | "edit" | "rename" | "delete" | "share";

export type AccessSubject = {
  ownerId: string;
  shares: ReadonlyArray<{ userId: string }>;
};

export function resolveRole(doc: AccessSubject, userId: string): Role | null {
  if (doc.ownerId === userId) return "owner";
  if (doc.shares.some((share) => share.userId === userId)) return "editor";
  return null;
}

const PERMISSIONS: Record<Role, ReadonlySet<DocumentAction>> = {
  owner: new Set(["read", "edit", "rename", "delete", "share"]),
  editor: new Set(["read", "edit"]),
};

export function can(role: Role | null, action: DocumentAction): boolean {
  return role !== null && PERMISSIONS[role].has(action);
}

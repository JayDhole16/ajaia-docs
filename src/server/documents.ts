import "server-only";
import { Prisma } from "@prisma/client";
import { AppError } from "@/lib/result";
import { EMPTY_DOC, type DocContent } from "@/lib/validation";
import { can, resolveRole, type DocumentAction, type Role } from "./access";
import { db } from "./db";

/**
 * Document data-access layer. Every function takes the acting user's id and
 * enforces the policy in access.ts — callers (actions/pages) cannot bypass it.
 * Inputs are assumed already validated by Zod in the action layer.
 */

export type DocumentSummary = {
  id: string;
  title: string;
  updatedAt: Date;
  owner: { id: string; name: string };
  shareCount: number;
};

export type DocumentDetail = {
  id: string;
  title: string;
  content: DocContent;
  updatedAt: Date;
  owner: { id: string; name: string; email: string };
  role: Role;
};

const summarySelect = {
  id: true,
  title: true,
  updatedAt: true,
  owner: { select: { id: true, name: true } },
  _count: { select: { shares: true } },
} satisfies Prisma.DocumentSelect;

type SummaryRow = Prisma.DocumentGetPayload<{ select: typeof summarySelect }>;

function toSummary(row: SummaryRow): DocumentSummary {
  return {
    id: row.id,
    title: row.title,
    updatedAt: row.updatedAt,
    owner: row.owner,
    shareCount: row._count.shares,
  };
}

export async function listOwnedDocuments(userId: string): Promise<DocumentSummary[]> {
  const rows = await db.document.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    select: summarySelect,
  });
  return rows.map(toSummary);
}

export async function listSharedDocuments(userId: string): Promise<DocumentSummary[]> {
  const rows = await db.document.findMany({
    where: { shares: { some: { userId } } },
    orderBy: { updatedAt: "desc" },
    select: summarySelect,
  });
  return rows.map(toSummary);
}

export async function countDocuments(userId: string): Promise<{ owned: number; shared: number }> {
  const [owned, shared] = await Promise.all([
    db.document.count({ where: { ownerId: userId } }),
    db.document.count({ where: { shares: { some: { userId } } } }),
  ]);
  return { owned, shared };
}

/**
 * Load a document with the caller's role and check `action` is allowed.
 * No access at all -> NOT_FOUND (don't reveal that the document exists).
 * Access but not this action -> FORBIDDEN.
 */
async function authorize(userId: string, documentId: string, action: DocumentAction) {
  const doc = await db.document.findUnique({
    where: { id: documentId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: { where: { userId }, select: { userId: true } },
    },
  });
  const role = doc ? resolveRole(doc, userId) : null;
  if (!doc || !role) throw new AppError("NOT_FOUND", "Document not found.");
  if (!can(role, action)) {
    throw new AppError("FORBIDDEN", "Only the document's owner can do that.");
  }
  return { doc, role };
}

export async function getDocumentForUser(userId: string, documentId: string): Promise<DocumentDetail> {
  const { doc, role } = await authorize(userId, documentId, "read");
  return {
    id: doc.id,
    title: doc.title,
    content: doc.content as DocContent,
    updatedAt: doc.updatedAt,
    owner: doc.owner,
    role,
  };
}

export async function createDocument(
  userId: string,
  input: { title?: string; content?: DocContent } = {},
): Promise<{ id: string }> {
  return db.document.create({
    data: {
      ownerId: userId,
      title: input.title ?? "Untitled document",
      content: (input.content ?? EMPTY_DOC) as Prisma.InputJsonValue,
    },
    select: { id: true },
  });
}

export async function renameDocument(userId: string, documentId: string, title: string) {
  await authorize(userId, documentId, "rename");
  return db.document.update({
    where: { id: documentId },
    data: { title },
    select: { id: true, title: true, updatedAt: true },
  });
}

export async function updateDocumentContent(userId: string, documentId: string, content: DocContent) {
  await authorize(userId, documentId, "edit");
  return db.document.update({
    where: { id: documentId },
    data: { content: content as Prisma.InputJsonValue },
    select: { id: true, updatedAt: true },
  });
}

export async function deleteDocument(userId: string, documentId: string): Promise<void> {
  await authorize(userId, documentId, "delete");
  await db.document.delete({ where: { id: documentId } });
}

/* ------------------------------------------------------------------ */
/* Sharing (owner-only)                                                */
/* ------------------------------------------------------------------ */

export type ShareInfo = {
  sharedWith: { id: string; name: string; email: string }[];
  candidates: { id: string; name: string; email: string }[];
};

export async function getShareInfo(userId: string, documentId: string): Promise<ShareInfo> {
  await authorize(userId, documentId, "share");
  const userSelect = { id: true, name: true, email: true } as const;
  const [shares, candidates] = await Promise.all([
    db.share.findMany({
      where: { documentId },
      orderBy: { createdAt: "asc" },
      select: { user: { select: userSelect } },
    }),
    db.user.findMany({
      where: { id: { not: userId }, shares: { none: { documentId } } },
      orderBy: { name: "asc" },
      select: userSelect,
    }),
  ]);
  return { sharedWith: shares.map((s) => s.user), candidates };
}

export async function shareDocument(userId: string, documentId: string, targetUserId: string) {
  await authorize(userId, documentId, "share");
  if (targetUserId === userId) {
    throw new AppError("VALIDATION", "You already own this document.");
  }
  const target = await db.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
  if (!target) throw new AppError("NOT_FOUND", "That user doesn't exist.");
  try {
    await db.share.create({ data: { documentId, userId: targetUserId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("CONFLICT", "That user already has access.");
    }
    throw error;
  }
}

export async function unshareDocument(userId: string, documentId: string, targetUserId: string) {
  await authorize(userId, documentId, "share");
  await db.share.deleteMany({ where: { documentId, userId: targetUserId } });
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseUpload } from "@/lib/import/parseUpload";
import { AppError, type ActionResult } from "@/lib/result";
import {
  firstIssue,
  idSchema,
  MAX_CONTENT_BYTES,
  renameSchema,
  shareSchema,
  updateContentSchema,
} from "@/lib/validation";
import {
  createDocument,
  deleteDocument,
  renameDocument,
  shareDocument,
  unshareDocument,
  updateDocumentContent,
} from "@/server/documents";
import { requireUser } from "@/server/session";
import { runAction } from "./run";

/**
 * All document mutations. Pattern for each action:
 *   1. requireUser()  — authenticate (outside runAction so redirects work)
 *   2. Zod parse      — never trust client input
 *   3. service call   — authorization is enforced inside the service
 *   4. revalidate     — refresh server-rendered lists/sidebar
 */

function refreshAll() {
  revalidatePath("/", "layout");
}

export async function createDocumentAction(): Promise<void> {
  const user = await requireUser();
  const { id } = await createDocument(user.id);
  refreshAll();
  redirect(`/documents/${id}`);
}

export async function renameDocumentAction(
  documentId: string,
  title: string,
): Promise<ActionResult<{ title: string }>> {
  const user = await requireUser();
  return runAction(async () => {
    const input = renameSchema.safeParse({ documentId, title });
    if (!input.success) throw new AppError("VALIDATION", firstIssue(input.error));
    const doc = await renameDocument(user.id, input.data.documentId, input.data.title);
    refreshAll();
    return { title: doc.title };
  });
}

/**
 * `contentJson` is the editor document as a JSON string. We deliberately don't
 * pass the object itself: ProseMirror re-uses `attrs` object instances across
 * nodes, and those arrived on the server as functions through React's
 * server-action argument encoding. A plain string round-trips exactly and lets
 * us enforce the size limit before parsing.
 */
export async function saveDocumentContentAction(
  documentId: string,
  contentJson: string,
): Promise<ActionResult<{ updatedAt: string }>> {
  const user = await requireUser();
  return runAction(async () => {
    if (typeof contentJson !== "string") throw new AppError("VALIDATION", "Invalid document content.");
    if (contentJson.length > MAX_CONTENT_BYTES) {
      throw new AppError("VALIDATION", "Document is too large to save (limit is about 1.5 MB).");
    }
    let content: unknown;
    try {
      content = JSON.parse(contentJson);
    } catch {
      throw new AppError("VALIDATION", "Invalid document content.");
    }
    const input = updateContentSchema.safeParse({ documentId, content });
    if (!input.success) {
      console.warn("[save] rejected content", input.error.issues.slice(0, 3));
      throw new AppError("VALIDATION", firstIssue(input.error));
    }
    const doc = await updateDocumentContent(user.id, input.data.documentId, input.data.content);
    // No revalidatePath here: autosave runs often and the editor already holds
    // the latest state. Lists are dynamic and re-fetched on navigation.
    return { updatedAt: doc.updatedAt.toISOString() };
  });
}

export async function deleteDocumentAction(documentId: string): Promise<ActionResult> {
  const user = await requireUser();
  const result = await runAction(async () => {
    const id = idSchema.safeParse(documentId);
    if (!id.success) throw new AppError("VALIDATION", firstIssue(id.error));
    await deleteDocument(user.id, id.data);
    return undefined;
  });
  if (!result.ok) return result;
  refreshAll();
  redirect("/documents");
}

export async function importDocumentAction(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  return runAction(async () => {
    const file = formData.get("file");
    if (!(file instanceof File)) throw new AppError("VALIDATION", "Choose a file to upload.");
    const parsed = parseUpload(file.name, new Uint8Array(await file.arrayBuffer()));
    const doc = await createDocument(user.id, parsed);
    refreshAll();
    return { id: doc.id };
  });
}

export async function shareDocumentAction(documentId: string, userId: string): Promise<ActionResult> {
  const user = await requireUser();
  return runAction(async () => {
    const input = shareSchema.safeParse({ documentId, userId });
    if (!input.success) throw new AppError("VALIDATION", firstIssue(input.error));
    await shareDocument(user.id, input.data.documentId, input.data.userId);
    refreshAll();
    return undefined;
  });
}

export async function unshareDocumentAction(documentId: string, userId: string): Promise<ActionResult> {
  const user = await requireUser();
  return runAction(async () => {
    const input = shareSchema.safeParse({ documentId, userId });
    if (!input.success) throw new AppError("VALIDATION", firstIssue(input.error));
    await unshareDocument(user.id, input.data.documentId, input.data.userId);
    refreshAll();
    return undefined;
  });
}

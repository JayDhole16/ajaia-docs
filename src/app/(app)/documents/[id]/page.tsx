import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteDocumentButton } from "@/components/DeleteDocumentButton";
import { DocumentEditor } from "@/components/editor/DocumentEditor";
import { ShareDialog } from "@/components/ShareDialog";
import { TitleInput } from "@/components/TitleInput";
import { AppError } from "@/lib/result";
import { getDocumentForUser, getShareInfo, type DocumentDetail } from "@/server/documents";
import { requireUser } from "@/server/session";

async function loadDocument(userId: string, id: string): Promise<DocumentDetail> {
  try {
    return await getDocumentForUser(userId, id);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps<"/documents/[id]">): Promise<Metadata> {
  const { id } = await params;
  const user = await requireUser();
  try {
    return { title: (await getDocumentForUser(user.id, id)).title };
  } catch {
    return { title: "Document" };
  }
}

export default async function DocumentPage({ params }: PageProps<"/documents/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const doc = await loadDocument(user.id, id);
  const isOwner = doc.role === "owner";
  const shareInfo = isOwner ? await getShareInfo(user.id, doc.id) : null;

  return (
    <div>
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-2 pt-3 pb-2 md:px-6">
          <Link
            href={isOwner ? "/documents" : "/documents?view=shared"}
            aria-label="Back to documents"
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:outline-none"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>

          {isOwner ? (
            // key: re-mount if the title changes elsewhere, so the input never shows stale state.
            <TitleInput key={doc.title} documentId={doc.id} initialTitle={doc.title} />
          ) : (
            <h1 className="min-w-0 flex-1 truncate px-2 py-1 text-lg font-semibold text-gray-900" title="Only the owner can rename this document">
              {doc.title}
            </h1>
          )}

          {isOwner && shareInfo && (
            <div className="flex items-center gap-2">
              <ShareDialog documentId={doc.id} sharedWith={shareInfo.sharedWith} candidates={shareInfo.candidates} />
              <DeleteDocumentButton documentId={doc.id} title={doc.title} />
            </div>
          )}
        </div>
        <div className="mx-auto max-w-4xl px-4 pb-2 md:px-8">
          {isOwner ? (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              Owned by you
              {shareInfo && shareInfo.sharedWith.length > 0
                ? ` · shared with ${shareInfo.sharedWith.map((p) => p.name.split(" ")[0]).join(", ")}`
                : " · private"}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              Shared with you by {doc.owner.name} · you can edit
            </span>
          )}
        </div>
      </header>

      <DocumentEditor key={doc.id} documentId={doc.id} initialContent={doc.content} />
    </div>
  );
}

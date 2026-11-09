import type { Metadata } from "next";
import Link from "next/link";
import { NewDocumentButton } from "@/components/NewDocumentButton";
import { TimeAgo } from "@/components/TimeAgo";
import { listOwnedDocuments, listSharedDocuments, type DocumentSummary } from "@/server/documents";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage({ searchParams }: PageProps<"/documents">) {
  const { view } = await searchParams;
  const showShared = view === "shared";
  const user = await requireUser();
  const documents = showShared ? await listSharedDocuments(user.id) : await listOwnedDocuments(user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{showShared ? "Shared with me" : "My documents"}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {showShared
            ? "Documents other people have shared with you. You can edit them; only the owner can rename, share or delete."
            : "Documents you own. Open one to edit, rename or share it."}
        </p>
      </header>

      {documents.length === 0 ? (
        <EmptyState shared={showShared} />
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {documents.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} shared={showShared} />
          ))}
        </ul>
      )}
    </div>
  );
}

function DocumentRow({ doc, shared }: { doc: DocumentSummary; shared: boolean }) {
  return (
    <li>
      <Link
        href={`/documents/${doc.id}`}
        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 focus-visible:bg-blue-50 focus-visible:outline-none"
      >
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
            <path d="M14 3v5h5M9 13h6M9 17h6" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-gray-900">{doc.title}</span>
          <span className="block text-xs text-gray-500">
            Edited <TimeAgo iso={doc.updatedAt.toISOString()} />
          </span>
        </span>
        {shared ? (
          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
            Owner: {doc.owner.name}
          </span>
        ) : doc.shareCount > 0 ? (
          <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-800">
            Shared with {doc.shareCount}
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
            Private
          </span>
        )}
      </Link>
    </li>
  );
}

function EmptyState({ shared }: { shared: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
      <h2 className="text-base font-semibold text-gray-900">
        {shared ? "Nothing has been shared with you yet" : "You don't have any documents yet"}
      </h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
        {shared
          ? "When another user shares a document with you, it will show up here."
          : "Create a blank document or upload a .txt / .md file to get started."}
      </p>
      {!shared && (
        <div className="mx-auto mt-5 max-w-48">
          <NewDocumentButton />
        </div>
      )}
      {shared && (
        <Link href="/documents" className="mt-5 inline-block text-sm font-medium text-blue-600 hover:underline">
          Go to my documents
        </Link>
      )}
    </div>
  );
}

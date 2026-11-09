"use client";

import { useRef, useState, useTransition } from "react";
import { deleteDocumentAction } from "@/actions/documents";

/** Owner-only delete with an explicit confirmation step. */
export function DeleteDocumentButton({ documentId, title }: { documentId: string; title: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          dialogRef.current?.showModal();
        }}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:outline-none"
      >
        Delete
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="delete-title"
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl p-0 shadow-xl backdrop:bg-gray-900/40"
      >
        <div className="p-5">
          <h2 id="delete-title" className="text-lg font-semibold text-gray-900">
            Delete this document?
          </h2>
          <p className="mt-1 text-sm break-words text-gray-600">
            &ldquo;{title}&rdquo; will be permanently deleted for you and everyone it&apos;s shared with.
          </p>
          {error && (
            <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              autoFocus
              onClick={() => dialogRef.current?.close()}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:outline-none"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  try {
                    // Redirects to /documents on success; only returns on failure.
                    const result = await deleteDocumentAction(documentId);
                    if (!result.ok) setError(result.error);
                  } catch {
                    setError("Couldn't delete. Check your connection and try again.");
                  }
                })
              }
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:outline-none disabled:opacity-60"
            >
              {pending ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

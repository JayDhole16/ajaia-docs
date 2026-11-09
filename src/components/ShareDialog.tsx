"use client";

import { useRef, useState, useTransition } from "react";
import { shareDocumentAction, unshareDocumentAction } from "@/actions/documents";

type Person = { id: string; name: string; email: string };

/**
 * Owner-only sharing dialog (native <dialog>: focus trap + Esc for free).
 * Lists come from the server; after each change the action revalidates the
 * page, so props here always reflect what's in the database.
 */
export function ShareDialog({
  documentId,
  sharedWith,
  candidates,
}: {
  documentId: string;
  sharedWith: Person[];
  candidates: Person[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const selectedId = candidates.some((c) => c.id === selected) ? selected : (candidates[0]?.id ?? "");

  function run(action: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await action();
        setMessage(result.ok ? { kind: "ok", text: success } : { kind: "error", text: result.error ?? "Failed." });
      } catch {
        setMessage({ kind: "error", text: "Couldn't reach the server. Try again." });
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMessage(null);
          dialogRef.current?.showModal();
        }}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:outline-none"
      >
        Share{sharedWith.length > 0 ? ` (${sharedWith.length})` : ""}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="share-title"
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl p-0 shadow-xl backdrop:bg-gray-900/40"
      >
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="share-title" className="text-lg font-semibold text-gray-900">
                Share document
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                People you share with can view and edit the content. Only you can rename, share or delete.
              </p>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close"
              className="rounded-md p-1 text-gray-500 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:outline-none"
            >
              ✕
            </button>
          </div>

          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!selectedId) return;
              const person = candidates.find((c) => c.id === selectedId);
              run(() => shareDocumentAction(documentId, selectedId), `Shared with ${person?.name ?? "user"}.`);
            }}
          >
            <label htmlFor="share-user" className="sr-only">
              Person to share with
            </label>
            <select
              id="share-user"
              value={selectedId}
              onChange={(e) => setSelected(e.target.value)}
              disabled={candidates.length === 0 || pending}
              className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none disabled:bg-gray-50"
            >
              {candidates.length === 0 ? (
                <option value="">Everyone already has access</option>
              ) : (
                candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))
              )}
            </select>
            <button
              type="submit"
              disabled={!selectedId || pending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:outline-none disabled:opacity-50"
            >
              {pending ? "Saving…" : "Share"}
            </button>
          </form>

          <div aria-live="polite" className="min-h-5">
            {message && (
              <p className={`mt-2 text-sm ${message.kind === "ok" ? "text-green-700" : "text-red-700"}`}>
                {message.text}
              </p>
            )}
          </div>

          <h3 className="mt-4 text-xs font-semibold tracking-wide text-gray-500 uppercase">People with access</h3>
          <ul className="mt-2 divide-y divide-gray-100 rounded-lg border border-gray-200">
            <li className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="text-gray-900">You</span>
              <span className="text-xs text-gray-500">Owner</span>
            </li>
            {sharedWith.map((person) => (
              <li key={person.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="block truncate text-gray-900">{person.name}</span>
                  <span className="block truncate text-xs text-gray-500">{person.email}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-gray-500">Can edit</span>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      run(() => unshareDocumentAction(documentId, person.id), `Removed access for ${person.name}.`)
                    }
                    className="rounded-md px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:outline-none disabled:opacity-50"
                  >
                    Remove
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </dialog>
    </>
  );
}

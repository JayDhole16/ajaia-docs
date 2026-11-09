"use client";

import { useState, useTransition } from "react";
import { renameDocumentAction } from "@/actions/documents";
import { MAX_TITLE_LENGTH } from "@/lib/validation";

/** Inline title editor. Commits on Enter or blur; Escape reverts. Owner-only. */
export function TitleInput({ documentId, initialTitle }: { documentId: string; initialTitle: string }) {
  const [title, setTitle] = useState(initialTitle);
  const [savedTitle, setSavedTitle] = useState(initialTitle);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function commit() {
    const next = title.trim();
    if (next === savedTitle) {
      setTitle(savedTitle);
      setError(null);
      return;
    }
    if (!next) {
      setError("Title can't be empty.");
      setTitle(savedTitle);
      return;
    }
    startTransition(async () => {
      try {
        const result = await renameDocumentAction(documentId, next);
        if (result.ok) {
          setSavedTitle(result.data.title);
          setTitle(result.data.title);
          setError(null);
        } else {
          setError(result.error);
        }
      } catch {
        setError("Couldn't rename. Check your connection and try again.");
      }
    });
  }

  return (
    <div className="min-w-0 flex-1">
      <label htmlFor="doc-title" className="sr-only">
        Document title
      </label>
      <input
        id="doc-title"
        value={title}
        maxLength={MAX_TITLE_LENGTH}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            setTitle(savedTitle);
            setError(null);
            // Defer blur so the reverted value is what commit() sees.
            const input = e.currentTarget;
            setTimeout(() => input.blur(), 0);
          }
        }}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "doc-title-error" : undefined}
        className="w-full truncate rounded-md border border-transparent bg-transparent px-2 py-1 text-lg font-semibold text-gray-900 hover:border-gray-200 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
      />
      <div aria-live="polite" className="px-2 text-xs">
        {pending && <span className="text-gray-500">Renaming…</span>}
        {error && (
          <span id="doc-title-error" className="text-red-700">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}

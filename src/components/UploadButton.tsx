"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { importDocumentAction } from "@/actions/documents";
import { isSupportedFile } from "@/lib/import/fileType";
import { MAX_UPLOAD_BYTES, UPLOAD_ACCEPT } from "@/lib/validation";

/**
 * Import a .txt/.md file as a new document. Validates on the client for fast
 * feedback; the server action re-validates everything (it is the authority).
 */
export function UploadButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onFileChosen(file: File) {
    setError(null);
    if (!isSupportedFile(file.name)) {
      setError(`"${file.name}" isn't supported. Choose a .txt or .md file.`);
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`File is too large. The limit is ${MAX_UPLOAD_BYTES / 1024} KB.`);
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      try {
        const result = await importDocumentAction(formData);
        if (result.ok) router.push(`/documents/${result.data.id}`);
        else setError(result.error);
      } catch {
        setError("Upload failed. Check your connection and try again.");
      }
    });
  }

  return (
    <div className="flex-1 md:flex-none">
      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ""; // allow re-selecting the same file after an error
          if (file) onFileChosen(file);
        }}
      />
      <button
        type="button"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        aria-describedby="upload-hint"
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:outline-none disabled:opacity-60"
      >
        <span aria-hidden>↑</span> {pending ? "Importing…" : "Upload file"}
      </button>
      <p id="upload-hint" className="mt-1 hidden text-center text-xs text-gray-500 md:block">
        .txt or .md, up to {MAX_UPLOAD_BYTES / 1024} KB
      </p>
      {error && (
        <p role="alert" className="mt-2 rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

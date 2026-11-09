"use client";

export type SaveStatus =
  | { kind: "saved"; at?: string }
  | { kind: "unsaved" }
  | { kind: "saving" }
  | { kind: "error"; message: string };

export function SaveIndicator({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  return (
    <div aria-live="polite" className="flex min-h-8 items-center gap-2 px-2 text-xs">
      {status.kind === "saved" && (
        <span className="flex items-center gap-1.5 text-gray-500" title={status.at ? `Saved at ${new Date(status.at).toLocaleTimeString()}` : undefined}>
          <span aria-hidden className="h-2 w-2 rounded-full bg-green-500" />
          All changes saved
        </span>
      )}
      {status.kind === "unsaved" && (
        <span className="flex items-center gap-1.5 text-gray-500">
          <span aria-hidden className="h-2 w-2 rounded-full bg-amber-400" />
          Unsaved changes
        </span>
      )}
      {status.kind === "saving" && (
        <span className="flex items-center gap-1.5 text-gray-500">
          <span aria-hidden className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
          Saving…
        </span>
      )}
      {status.kind === "error" && (
        <span role="alert" className="flex items-center gap-2 text-red-700">
          <span aria-hidden className="h-2 w-2 rounded-full bg-red-500" />
          <span>Not saved: {status.message}</span>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md border border-red-200 bg-white px-2 py-0.5 font-medium hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:outline-none"
          >
            Retry
          </button>
        </span>
      )}
    </div>
  );
}

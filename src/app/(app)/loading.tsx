export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="mb-6 h-7 w-48 animate-pulse rounded bg-gray-200" />
      <div className="space-y-px overflow-hidden rounded-xl border border-gray-200 bg-white">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center" role="alert">
      <h1 className="text-xl font-semibold text-gray-900">Something went wrong</h1>
      <p className="mt-2 text-sm text-gray-500">
        We couldn&apos;t load this page. This is usually temporary — try again in a moment.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={() => retry()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:outline-none"
        >
          Try again
        </button>
        <Link
          href="/documents"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to documents
        </Link>
      </div>
    </div>
  );
}

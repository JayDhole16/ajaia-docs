import Link from "next/link";

export default function DocumentNotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-gray-900">Document not available</h1>
      <p className="mt-2 text-sm text-gray-500">
        This document doesn&apos;t exist, was deleted, or hasn&apos;t been shared with you. Ask the owner to share it
        with your account.
      </p>
      <Link href="/documents" className="mt-6 inline-block text-sm font-medium text-blue-600 hover:underline">
        Back to documents
      </Link>
    </div>
  );
}

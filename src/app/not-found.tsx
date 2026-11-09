import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <p className="text-sm font-medium text-blue-600">404</p>
      <h1 className="mt-1 text-xl font-semibold text-gray-900">Page not found</h1>
      <p className="mt-2 text-sm text-gray-500">The page you were looking for doesn&apos;t exist.</p>
      <Link href="/documents" className="mt-6 inline-block text-sm font-medium text-blue-600 hover:underline">
        Back to documents
      </Link>
    </main>
  );
}

import Link from "next/link";
import { logoutAction } from "@/actions/auth";
import { NewDocumentButton } from "@/components/NewDocumentButton";
import { SidebarNav } from "@/components/SidebarNav";
import { UploadButton } from "@/components/UploadButton";
import { countDocuments } from "@/server/documents";
import { requireUser } from "@/server/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const counts = await countDocuments(user.id);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-gray-200 bg-white md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:border-r md:border-b-0">
        <div className="flex h-full flex-col gap-4 p-4">
          <Link
            href="/documents"
            className="flex items-center gap-2 rounded-lg focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:outline-none"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">
              A
            </span>
            <span className="font-semibold text-gray-900">Ajaia Docs</span>
          </Link>

          <div className="flex gap-2 md:flex-col">
            <NewDocumentButton />
            <UploadButton />
          </div>

          <SidebarNav ownedCount={counts.owned} sharedCount={counts.shared} />

          <div className="mt-auto flex items-center justify-between gap-2 border-t border-gray-100 pt-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900">{user.name}</p>
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:outline-none"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

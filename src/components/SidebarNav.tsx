"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function SidebarNav({ ownedCount, sharedCount }: { ownedCount: number; sharedCount: number }) {
  const pathname = usePathname();
  const view = useSearchParams().get("view");
  const onList = pathname === "/documents";

  const items = [
    { href: "/documents", label: "My documents", count: ownedCount, active: onList && view !== "shared" },
    { href: "/documents?view=shared", label: "Shared with me", count: sharedCount, active: onList && view === "shared" },
  ];

  return (
    <nav aria-label="Documents">
      <ul className="flex gap-1 md:flex-col">
        {items.map((item) => (
          <li key={item.href} className="flex-1 md:flex-none">
            <Link
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:outline-none ${
                item.active ? "bg-blue-50 font-medium text-blue-700" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>{item.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${item.active ? "bg-blue-100" : "bg-gray-100 text-gray-600"}`}
              >
                {item.count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

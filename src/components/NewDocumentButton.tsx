"use client";

import { useFormStatus } from "react-dom";
import { createDocumentAction } from "@/actions/documents";

function SubmitButton({ className }: { className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:outline-none disabled:opacity-60 ${className ?? ""}`}
    >
      <span aria-hidden>＋</span> {pending ? "Creating…" : "New document"}
    </button>
  );
}

export function NewDocumentButton({ className }: { className?: string }) {
  return (
    <form action={createDocumentAction} className="flex-1 md:flex-none">
      <SubmitButton className={className} />
    </form>
  );
}

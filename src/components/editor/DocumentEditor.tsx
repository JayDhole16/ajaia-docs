"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { useCallback, useEffect, useRef, useState } from "react";
import { saveDocumentContentAction } from "@/actions/documents";
import type { DocContent } from "@/lib/validation";
import { SaveIndicator, type SaveStatus } from "./SaveIndicator";
import { Toolbar } from "./Toolbar";

const AUTOSAVE_DELAY_MS = 800;

/**
 * Rich-text editor with debounced autosave.
 *
 * Save model (no faked persistence):
 *  - every edit bumps `version`; a save sends the current JSON and records which
 *    version the server confirmed
 *  - only one save is in flight at a time; edits made during a save trigger
 *    another save afterwards, so the latest content always wins
 *  - "Saved" is shown only after the server confirms; failures show an error with Retry
 */
export function DocumentEditor({ documentId, initialContent }: { documentId: string; initialContent: DocContent }) {
  const [status, setStatus] = useState<SaveStatus>({ kind: "saved" });
  const version = useRef(0);
  const savedVersion = useRef(0);
  const inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef<() => Promise<void>>(async () => {});

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true },
      }),
      Placeholder.configure({ placeholder: "Start writing…" }),
    ],
    content: initialContent,
    immediatelyRender: false, // required for SSR: render on the client only
    editorProps: {
      attributes: {
        class: "doc-content",
        "aria-label": "Document content",
        "aria-multiline": "true",
        role: "textbox",
      },
    },
    onUpdate: () => {
      version.current += 1;
      setStatus({ kind: "unsaved" });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void saveRef.current(), AUTOSAVE_DELAY_MS);
    },
  });

  const save = useCallback(async () => {
    if (!editor) return;
    if (timer.current) clearTimeout(timer.current);
    if (inFlight.current) return; // the in-flight save re-checks the version when it finishes
    const sendingVersion = version.current;
    if (sendingVersion === savedVersion.current) {
      setStatus({ kind: "saved" });
      return;
    }

    inFlight.current = true;
    setStatus({ kind: "saving" });
    let result: Awaited<ReturnType<typeof saveDocumentContentAction>>;
    try {
      // Sent as a string on purpose — see saveDocumentContentAction.
      result = await saveDocumentContentAction(documentId, JSON.stringify(editor.getJSON()));
    } catch {
      result = { ok: false, error: "Couldn't reach the server. Check your connection." };
    }
    inFlight.current = false;

    if (!result.ok) {
      setStatus({ kind: "error", message: result.error });
      return;
    }
    savedVersion.current = sendingVersion;
    if (version.current !== sendingVersion) {
      // More edits arrived while saving — save again right away.
      void saveRef.current();
    } else {
      setStatus({ kind: "saved", at: result.data.updatedAt });
    }
  }, [documentId, editor]);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  // Ctrl/Cmd+S saves immediately instead of opening the browser's save dialog.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Warn before closing the tab with unsaved changes.
  const hasUnsaved = status.kind !== "saved";
  useEffect(() => {
    if (!hasUnsaved) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsaved]);

  // Flush pending changes when navigating away inside the app.
  useEffect(
    () => () => {
      if (version.current !== savedVersion.current) void saveRef.current();
    },
    [],
  );

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-2 py-1.5 md:px-6">
          {editor ? <Toolbar editor={editor} /> : <div className="h-8 flex-1" aria-hidden />}
          <SaveIndicator status={status} onRetry={() => void save()} />
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-2 py-4 md:px-6 md:py-8">
        <div className="min-h-[70vh] rounded-xl border border-gray-200 bg-white px-5 py-6 shadow-sm md:px-14 md:py-12">
          {editor ? (
            <EditorContent editor={editor} />
          ) : (
            <div className="space-y-3" aria-busy="true">
              <span className="sr-only">Loading editor…</span>
              <div className="h-6 w-2/3 animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-gray-100" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

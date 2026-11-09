"use client";

import { useEditorState, type Editor } from "@tiptap/react";
import type { ReactNode } from "react";

// Fixed label (not platform-sniffed) so server and client render the same HTML.
const mod = "Ctrl/⌘";

/**
 * Mounted only once the editor exists (see DocumentEditor), so useEditorState
 * computes active states on first render instead of after the first edit.
 */
export function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        underline: e.isActive("underline"),
        h1: e.isActive("heading", { level: 1 }),
        h2: e.isActive("heading", { level: 2 }),
        h3: e.isActive("heading", { level: 3 }),
        paragraph: e.isActive("paragraph"),
        bulletList: e.isActive("bulletList"),
        orderedList: e.isActive("orderedList"),
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
      }),
  });

  const disabled = !editor.isEditable;
  const chain = () => editor.chain().focus();

  return (
    <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5">
      <Button label={`Undo (${mod}+Z)`} disabled={disabled || !state.canUndo} onClick={() => chain().undo().run()}>
        <Icon d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />
      </Button>
      <Button label={`Redo (${mod}+Shift+Z)`} disabled={disabled || !state.canRedo} onClick={() => chain().redo().run()}>
        <Icon d="m15 14 5-5-5-5M20 9H10a6 6 0 0 0 0 12h3" />
      </Button>
      <Divider />
      <Button label="Normal text" active={state.paragraph} disabled={disabled} onClick={() => chain().setParagraph().run()}>
        <span className="text-sm">Text</span>
      </Button>
      <Button label="Heading 1" active={state.h1} disabled={disabled} onClick={() => chain().toggleHeading({ level: 1 }).run()}>
        <span className="text-sm font-bold">H1</span>
      </Button>
      <Button label="Heading 2" active={state.h2} disabled={disabled} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
        <span className="text-sm font-bold">H2</span>
      </Button>
      <Button label="Heading 3" active={state.h3} disabled={disabled} onClick={() => chain().toggleHeading({ level: 3 }).run()}>
        <span className="text-sm font-bold">H3</span>
      </Button>
      <Divider />
      <Button label={`Bold (${mod}+B)`} active={state.bold} disabled={disabled} onClick={() => chain().toggleBold().run()}>
        <span className="font-bold">B</span>
      </Button>
      <Button label={`Italic (${mod}+I)`} active={state.italic} disabled={disabled} onClick={() => chain().toggleItalic().run()}>
        <span className="font-serif italic">I</span>
      </Button>
      <Button label={`Underline (${mod}+U)`} active={state.underline} disabled={disabled} onClick={() => chain().toggleUnderline().run()}>
        <span className="underline">U</span>
      </Button>
      <Divider />
      <Button label="Bulleted list" active={state.bulletList} disabled={disabled} onClick={() => chain().toggleBulletList().run()}>
        <Icon d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
      </Button>
      <Button label="Numbered list" active={state.orderedList} disabled={disabled} onClick={() => chain().toggleOrderedList().run()}>
        <Icon d="M10 6h10M10 12h10M10 18h10M4 5h1v4M4 9h2M4 15h2l-2 3h2" />
      </Button>
    </div>
  );
}

function Button({
  label,
  active = false,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 text-gray-700 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:outline-none disabled:opacity-40 ${
        active ? "bg-blue-100 text-blue-800" : "hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-gray-200" />;
}

function Icon({ d }: { d: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

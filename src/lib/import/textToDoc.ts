import type { DocContent, RichTextNode } from "../validation";

/**
 * Plain text -> TipTap document.
 * Blank lines separate paragraphs; single newlines become hard line breaks,
 * so the imported document looks like the original file.
 */
export function textToDoc(input: string): DocContent {
  const normalized = input.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const blocks = normalized
    .split(/\n[ \t]*\n+/)
    .map((block) => block.replace(/^\n+|\n+$/g, ""))
    .filter((block) => block.trim().length > 0);

  if (blocks.length === 0) return { type: "doc", content: [{ type: "paragraph" }] };

  return {
    type: "doc",
    content: blocks.map((block) => {
      const inline: RichTextNode[] = [];
      block.split("\n").forEach((line, i) => {
        if (i > 0) inline.push({ type: "hardBreak" });
        if (line.length > 0) inline.push({ type: "text", text: line });
      });
      return { type: "paragraph", content: inline };
    }),
  };
}

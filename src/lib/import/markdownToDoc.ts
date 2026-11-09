import { marked, type Token, type Tokens } from "marked";
import type { DocContent, RichTextNode } from "../validation";

/**
 * Markdown -> TipTap document, by walking marked's token tree.
 *
 * Supported: headings (H4+ become H3), paragraphs, bold, italic, strikethrough, inline code,
 * links (http/https/mailto only), bullet/ordered/nested lists, blockquotes,
 * code blocks, horizontal rules, line breaks.
 * Degrades gracefully: tables become one paragraph per row, images become their
 * alt text, raw HTML tags are dropped (their text is kept). Never throws on
 * valid UTF-8 input.
 */
type Mark = NonNullable<RichTextNode["marks"]>[number];

export function markdownToDoc(markdown: string): DocContent {
  const source = markdown.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const tokens = marked.lexer(source, { gfm: true });
  const content = blocksFrom(tokens);
  return { type: "doc", content: content.length > 0 ? content : [{ type: "paragraph" }] };
}

/* ----------------------------- block level ----------------------------- */

function blocksFrom(tokens: Token[]): RichTextNode[] {
  return tokens.flatMap(blockFrom);
}

function blockFrom(token: Token): RichTextNode[] {
  switch (token.type) {
    case "heading": {
      const t = token as Tokens.Heading;
      return [
        {
          type: "heading",
          attrs: { level: Math.min(Math.max(t.depth, 1), 3) }, // editor offers H1–H3
          content: inlineFrom(t.tokens, []),
        },
      ];
    }
    case "paragraph":
      return [paragraph(inlineFrom((token as Tokens.Paragraph).tokens, []))];
    case "text": {
      // Block-level text appears inside tight list items.
      const t = token as Tokens.Text;
      return [paragraph(t.tokens ? inlineFrom(t.tokens, []) : textNodes(t.text, []))];
    }
    case "list": {
      const t = token as Tokens.List;
      const items: RichTextNode[] = t.items.map((item) => {
        const children = blocksFrom(item.tokens);
        if (item.task) {
          const prefix = item.checked ? "[x] " : "[ ] ";
          if (children[0]?.type === "paragraph") {
            children[0] = {
              ...children[0],
              content: [{ type: "text", text: prefix }, ...(children[0].content ?? [])],
            };
          }
        }
        // ProseMirror requires a list item to start with a paragraph.
        if (children[0]?.type !== "paragraph") children.unshift({ type: "paragraph" });
        return { type: "listItem", content: children };
      });
      if (t.ordered) {
        const start = typeof t.start === "number" ? t.start : 1;
        return [{ type: "orderedList", attrs: { start }, content: items }];
      }
      return [{ type: "bulletList", content: items }];
    }
    case "blockquote": {
      const inner = blocksFrom((token as Tokens.Blockquote).tokens);
      return [{ type: "blockquote", content: inner.length > 0 ? inner : [{ type: "paragraph" }] }];
    }
    case "code": {
      const t = token as Tokens.Code;
      return [
        {
          type: "codeBlock",
          attrs: { language: t.lang?.trim() || null },
          ...(t.text.length > 0 ? { content: [{ type: "text" as const, text: t.text }] } : {}),
        },
      ];
    }
    case "hr":
      return [{ type: "horizontalRule" }];
    case "table": {
      const t = token as Tokens.Table;
      return [t.header, ...t.rows].map((row) =>
        paragraph(
          row.flatMap((cell, i) => [
            ...(i > 0 ? textNodes(" | ", []) : []),
            ...inlineFrom(cell.tokens, []),
          ]),
        ),
      );
    }
    case "html": {
      const text = stripTags((token as Tokens.HTML).text).trim();
      return text ? [paragraph(textNodes(text, []))] : [];
    }
    case "space":
    case "def":
      return [];
    default: {
      // Unknown/extension token: keep its readable text rather than losing it.
      const raw = "text" in token && typeof token.text === "string" ? token.text : token.raw;
      return raw.trim() ? [paragraph(textNodes(raw.trim(), []))] : [];
    }
  }
}

function paragraph(content: RichTextNode[]): RichTextNode {
  return content.length > 0 ? { type: "paragraph", content } : { type: "paragraph" };
}

/* ----------------------------- inline level ---------------------------- */

function inlineFrom(tokens: Token[] | undefined, marks: Mark[]): RichTextNode[] {
  if (!tokens) return [];
  return tokens.flatMap((token) => inlineTokenFrom(token, marks));
}

function inlineTokenFrom(token: Token, marks: Mark[]): RichTextNode[] {
  switch (token.type) {
    case "text": {
      const t = token as Tokens.Text;
      return t.tokens ? inlineFrom(t.tokens, marks) : textNodes(t.text, marks);
    }
    case "escape":
      return textNodes((token as Tokens.Escape).text, marks);
    case "strong":
      return inlineFrom((token as Tokens.Strong).tokens, withMark(marks, { type: "bold" }));
    case "em":
      return inlineFrom((token as Tokens.Em).tokens, withMark(marks, { type: "italic" }));
    case "del":
      return inlineFrom((token as Tokens.Del).tokens, withMark(marks, { type: "strike" }));
    case "codespan":
      // The code mark excludes all other marks in TipTap, so apply it alone.
      return textNodes((token as Tokens.Codespan).text, [{ type: "code" }]);
    case "br":
      return [{ type: "hardBreak" }];
    case "link": {
      const t = token as Tokens.Link;
      const href = safeHref(t.href);
      const linkMarks = href ? withMark(marks, { type: "link", attrs: { href } }) : marks;
      return inlineFrom(t.tokens, linkMarks);
    }
    case "image":
      return textNodes((token as Tokens.Image).text, marks);
    case "html":
      return []; // drop inline tags like <b>; the text between them is separate tokens
    default:
      return "text" in token && typeof token.text === "string" ? textNodes(token.text, marks) : [];
  }
}

function withMark(marks: Mark[], mark: Mark): Mark[] {
  return marks.some((m) => m.type === mark.type) ? marks : [...marks, mark];
}

/** Text node(s) with entities decoded and soft line breaks collapsed. Empty text is not allowed. */
function textNodes(raw: string, marks: Mark[]): RichTextNode[] {
  const text = decodeEntities(raw).replace(/\n/g, " ");
  if (text.length === 0) return [];
  return [marks.length > 0 ? { type: "text", text, marks } : { type: "text", text }];
}

function safeHref(href: string): string | null {
  try {
    const url = new URL(href);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " "));
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const code =
        entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

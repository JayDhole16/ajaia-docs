import { describe, expect, it } from "vitest";
import { markdownToDoc } from "@/lib/import/markdownToDoc";
import { parseUpload, titleFromFileName } from "@/lib/import/parseUpload";
import { textToDoc } from "@/lib/import/textToDoc";
import { docContentSchema, MAX_UPLOAD_BYTES } from "@/lib/validation";

const bytes = (s: string) => new TextEncoder().encode(s);

describe("markdownToDoc", () => {
  it("converts headings, marks and lists into editor nodes", () => {
    const doc = markdownToDoc("# Title\n\nSome **bold**, *italic* and `code`.\n\n- one\n- two\n\n1. first\n2. second");
    expect(doc.content?.[0]).toEqual({
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Title" }],
    });
    expect(doc.content?.[1].content).toEqual([
      { type: "text", text: "Some " },
      { type: "text", text: "bold", marks: [{ type: "bold" }] },
      { type: "text", text: ", " },
      { type: "text", text: "italic", marks: [{ type: "italic" }] },
      { type: "text", text: " and " },
      { type: "text", text: "code", marks: [{ type: "code" }] },
      { type: "text", text: "." },
    ]);
    expect(doc.content?.[2].type).toBe("bulletList");
    expect(doc.content?.[2].content).toHaveLength(2);
    expect(doc.content?.[3]).toMatchObject({ type: "orderedList", attrs: { start: 1 } });
  });

  it("handles nested lists, entities, unsafe links and raw HTML safely", () => {
    const doc = markdownToDoc(
      "- parent\n  - child\n\nTom &amp; Jerry <b>bold</b> [x](javascript:alert(1)) [ok](https://example.com)",
    );
    const parent = doc.content?.[0].content?.[0];
    expect(parent?.content?.[0].type).toBe("paragraph");
    expect(parent?.content?.[1].type).toBe("bulletList");

    const para = doc.content?.[1].content ?? [];
    const text = para.map((n) => n.text).join("");
    expect(text).toContain("Tom & Jerry");
    expect(text).not.toContain("<b>");
    const links = para.flatMap((n) => n.marks ?? []).filter((m) => m.type === "link");
    expect(links).toEqual([{ type: "link", attrs: { href: "https://example.com/" } }]);
  });

  it("always produces content that passes the save schema", () => {
    const samples = [
      "",
      "#### deep heading",
      "| a | b |\n|---|---|\n| 1 | 2 |",
      "```ts\nconst x = 1;\n```",
      "> quote\n\n---\n\n![alt text](img.png)",
      "- [ ] task\n- [x] done",
    ];
    for (const md of samples) {
      expect(docContentSchema.safeParse(markdownToDoc(md)).success, md).toBe(true);
    }
  });
});

describe("textToDoc", () => {
  it("splits paragraphs on blank lines and keeps single line breaks", () => {
    const doc = textToDoc("line one\nline two\r\n\r\nsecond paragraph");
    expect(doc.content).toEqual([
      {
        type: "paragraph",
        content: [{ type: "text", text: "line one" }, { type: "hardBreak" }, { type: "text", text: "line two" }],
      },
      { type: "paragraph", content: [{ type: "text", text: "second paragraph" }] },
    ]);
  });
});

describe("parseUpload", () => {
  it("imports .txt and .md files and derives the title from the filename", () => {
    expect(parseUpload("meeting_notes.txt", bytes("hello")).title).toBe("meeting notes");
    expect(parseUpload("README.md", bytes("# Hi")).content.content?.[0].type).toBe("heading");
  });

  it("rejects unsupported, empty, oversized, binary and non-UTF-8 files", () => {
    expect(() => parseUpload("photo.png", bytes("x"))).toThrow(/Unsupported file type/);
    expect(() => parseUpload("noext", bytes("x"))).toThrow(/Unsupported file type/);
    expect(() => parseUpload("empty.txt", new Uint8Array())).toThrow(/empty/);
    expect(() => parseUpload("blank.md", bytes("  \n\n "))).toThrow(/no text/);
    expect(() => parseUpload("big.txt", new Uint8Array(MAX_UPLOAD_BYTES + 1).fill(97))).toThrow(/too large/);
    expect(() => parseUpload("bin.txt", new Uint8Array([104, 0, 105]))).toThrow(/binary/);
    expect(() => parseUpload("latin1.txt", new Uint8Array([0xff, 0xfe, 0xfd]))).toThrow(/UTF-8/);
  });

  it("falls back to a default title", () => {
    expect(titleFromFileName("___.md")).toBe("Imported document");
  });
});

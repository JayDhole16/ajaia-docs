import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Primitive inputs                                                    */
/* ------------------------------------------------------------------ */

export const MAX_TITLE_LENGTH = 200;

export const idSchema = z.string().trim().min(1, "Missing id").max(64, "Invalid id");

export const titleSchema = z
  .string()
  .trim()
  .min(1, "Title can't be empty")
  .max(MAX_TITLE_LENGTH, `Title must be ${MAX_TITLE_LENGTH} characters or fewer`);

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password").max(200),
});

export const renameSchema = z.object({ documentId: idSchema, title: titleSchema });

export const shareSchema = z.object({ documentId: idSchema, userId: idSchema });

/* ------------------------------------------------------------------ */
/* Rich-text content (TipTap / ProseMirror JSON)                       */
/* ------------------------------------------------------------------ */

/** Max serialized size of a document body. Keeps rows and payloads sane. */
export const MAX_CONTENT_BYTES = 1_500_000;

/** Exactly the node and mark types the editor (StarterKit) can render. */
export const NODE_TYPES = [
  "paragraph",
  "text",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "codeBlock",
  "horizontalRule",
  "hardBreak",
] as const;

export const MARK_TYPES = ["bold", "italic", "underline", "strike", "code", "link"] as const;

const markSchema = z.object({
  type: z.enum(MARK_TYPES),
  attrs: z.record(z.string(), z.unknown()).optional(),
});

export type RichTextNode = {
  type: (typeof NODE_TYPES)[number];
  attrs?: Record<string, unknown>;
  content?: RichTextNode[];
  marks?: z.infer<typeof markSchema>[];
  text?: string;
};

const nodeSchema: z.ZodType<RichTextNode> = z.lazy(() =>
  z.object({
    type: z.enum(NODE_TYPES),
    attrs: z.record(z.string(), z.unknown()).optional(),
    content: z.array(nodeSchema).optional(),
    marks: z.array(markSchema).optional(),
    text: z.string().optional(),
  }),
);

export const docContentSchema = z
  .object({
    type: z.literal("doc"),
    content: z.array(nodeSchema).optional(),
  })
  .refine((doc) => JSON.stringify(doc).length <= MAX_CONTENT_BYTES, {
    message: "Document is too large to save (limit is about 1.5 MB).",
  });

export type DocContent = z.infer<typeof docContentSchema>;

export const updateContentSchema = z.object({
  documentId: idSchema,
  content: docContentSchema,
});

export const EMPTY_DOC: DocContent = { type: "doc", content: [{ type: "paragraph" }] };

/* ------------------------------------------------------------------ */
/* File import                                                         */
/* ------------------------------------------------------------------ */

export const MAX_UPLOAD_BYTES = 500 * 1024; // 500 KB
export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".markdown"] as const;
export const UPLOAD_ACCEPT = ".txt,.md,.markdown,text/plain,text/markdown";

/** Flatten a ZodError into the first message, for compact UI errors. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}

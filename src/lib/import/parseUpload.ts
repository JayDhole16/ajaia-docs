import { AppError } from "../result";
import { docContentSchema, MAX_TITLE_LENGTH, MAX_UPLOAD_BYTES, type DocContent } from "../validation";
import { getExtension, isSupportedFile } from "./fileType";
import { markdownToDoc } from "./markdownToDoc";
import { textToDoc } from "./textToDoc";

export type ParsedUpload = { title: string; content: DocContent };

/**
 * Validate an uploaded file and convert it to a document.
 * Pure (no I/O) so the same rules can be unit-tested and re-used client-side.
 */
export function parseUpload(fileName: string, bytes: Uint8Array): ParsedUpload {
  const extension = getExtension(fileName);
  if (!isSupportedFile(fileName)) {
    throw new AppError(
      "VALIDATION",
      `Unsupported file type${extension ? ` "${extension}"` : ""}. Upload a .txt or .md file.`,
    );
  }
  if (bytes.byteLength === 0) throw new AppError("VALIDATION", "That file is empty.");
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new AppError("VALIDATION", `File is too large. The limit is ${MAX_UPLOAD_BYTES / 1024} KB.`);
  }

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new AppError("VALIDATION", "File isn't valid UTF-8 text.");
  }
  if (text.includes("\u0000")) {
    throw new AppError("VALIDATION", "File looks like binary data, not text.");
  }
  if (text.trim().length === 0) throw new AppError("VALIDATION", "That file has no text in it.");

  const content = extension === ".txt" ? textToDoc(text) : markdownToDoc(text);
  // Defence in depth: the converter output must satisfy the same schema as editor saves.
  const checked = docContentSchema.safeParse(content);
  if (!checked.success) {
    throw new AppError("VALIDATION", "File is too large or complex to import.");
  }

  return { title: titleFromFileName(fileName), content: checked.data };
}

export function titleFromFileName(fileName: string): string {
  const base = fileName.replace(/^.*[\\/]/, "");
  const withoutExt = base.slice(0, base.length - getExtension(base).length);
  const cleaned = withoutExt.replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
  return (cleaned || "Imported document").slice(0, MAX_TITLE_LENGTH);
}

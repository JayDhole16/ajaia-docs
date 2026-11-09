import { SUPPORTED_EXTENSIONS } from "../validation";

/** Lower-cased extension including the dot, e.g. ".md"; "" when there is none. */
export function getExtension(fileName: string): string {
  const base = fileName.replace(/^.*[\\/]/, "");
  const dot = base.lastIndexOf(".");
  return dot <= 0 ? "" : base.slice(dot).toLowerCase();
}

export function isSupportedFile(fileName: string): boolean {
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(getExtension(fileName));
}

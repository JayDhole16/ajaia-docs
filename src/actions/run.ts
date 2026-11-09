import "server-only";
import { unstable_rethrow } from "next/navigation";
import { AppError, type ActionResult } from "@/lib/result";

/**
 * Run action logic and convert failures into an ActionResult:
 *  - AppError (expected: validation, not found, forbidden...) -> its message
 *  - anything else -> logged server-side, generic message to the client
 *  - Next.js control flow (redirect/notFound) -> re-thrown untouched
 */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AppError) return { ok: false, error: error.message };
    console.error("[action] unexpected error", error);
    return { ok: false, error: "Something went wrong on our side. Please try again." };
  }
}

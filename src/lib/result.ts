/** Uniform return type for Server Actions: never throw raw errors to the client. */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type AppErrorCode = "NOT_FOUND" | "FORBIDDEN" | "VALIDATION" | "CONFLICT";

/** Expected, user-facing failures thrown by the service layer. */
export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

import { describe, expect, it } from "vitest";
import { decodeSession, encodeSession } from "@/server/session";
import { docContentSchema, MAX_CONTENT_BYTES, titleSchema } from "@/lib/validation";

describe("docContentSchema", () => {
  it("accepts editor JSON with supported nodes and marks", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Hi" }] },
        { type: "paragraph", content: [{ type: "text", text: "u", marks: [{ type: "underline" }] }] },
      ],
    };
    expect(docContentSchema.safeParse(doc).success).toBe(true);
  });

  it("rejects non-documents, unknown node types and oversized bodies", () => {
    expect(docContentSchema.safeParse({ type: "paragraph" }).success).toBe(false);
    expect(docContentSchema.safeParse({ type: "doc", content: [{ type: "script" }] }).success).toBe(false);
    const huge = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "x".repeat(MAX_CONTENT_BYTES) }] }] };
    expect(docContentSchema.safeParse(huge).success).toBe(false);
  });
});

describe("titleSchema", () => {
  it("trims and enforces length", () => {
    expect(titleSchema.parse("  Plan  ")).toBe("Plan");
    expect(titleSchema.safeParse("   ").success).toBe(false);
    expect(titleSchema.safeParse("x".repeat(201)).success).toBe(false);
  });
});

describe("session tokens", () => {
  process.env.SESSION_SECRET ??= "test-secret-test-secret-test-secret-123";

  it("round-trips a valid token and rejects tampering or expiry", () => {
    const future = Date.now() + 60_000;
    const token = encodeSession("user_1", future);
    expect(decodeSession(token)).toBe("user_1");
    expect(decodeSession(token.replace("user_1", "user_2"))).toBeNull();
    expect(decodeSession(encodeSession("user_1", Date.now() - 1))).toBeNull();
    expect(decodeSession("garbage")).toBeNull();
  });
});

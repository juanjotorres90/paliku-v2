import { describe, it, expect } from "vitest";
import { resolveWebOrigin } from "./origin";
import type { CorsConfig } from "../../../domain/config";

describe("resolveWebOrigin", () => {
  const corsConfig: CorsConfig = {
    allowedOrigins: [
      "http://localhost:3000",
      "https://example.com",
      "https://app.example.com",
    ],
  };

  it("should return first matching allowed origin", () => {
    const result = resolveWebOrigin(
      ["https://example.com", "https://other.com"],
      corsConfig,
    );
    expect(result).toBe("https://example.com");
  });

  it("should skip null and undefined candidates", () => {
    const result = resolveWebOrigin(
      [null, undefined, "https://example.com"],
      corsConfig,
    );
    expect(result).toBe("https://example.com");
  });

  it("should return first allowed origin when no candidates match", () => {
    const result = resolveWebOrigin(
      ["https://unknown.com", "https://other.com"],
      corsConfig,
    );
    expect(result).toBe("http://localhost:3000");
  });

  it("should return fallback when allowedOrigins is empty and no match", () => {
    const emptyConfig: CorsConfig = { allowedOrigins: [] };
    const result = resolveWebOrigin(["https://unknown.com"], emptyConfig);
    expect(result).toBe("http://localhost:3000");
  });

  it("should return first allowed origin when candidates is empty", () => {
    const result = resolveWebOrigin([], corsConfig);
    expect(result).toBe("http://localhost:3000");
  });

  it("should match second candidate if first does not match", () => {
    const result = resolveWebOrigin(
      ["https://unknown.com", "https://app.example.com"],
      corsConfig,
    );
    expect(result).toBe("https://app.example.com");
  });
});

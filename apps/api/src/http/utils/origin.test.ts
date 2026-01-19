import { describe, it, expect } from "vitest";
import { resolveWebOrigin } from "./origin";
import type { CorsConfig } from "../../server/config";

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

  it("should return fallback origin when none match", () => {
    const result = resolveWebOrigin(["https://evil.com"], corsConfig);
    expect(result).toBe("http://localhost:3000");
  });

  it("should return first allowed origin when no candidates", () => {
    const result = resolveWebOrigin([undefined], corsConfig);
    expect(result).toBe("http://localhost:3000");
  });
});

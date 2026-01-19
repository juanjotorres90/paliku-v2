import { describe, it, expect } from "vitest";
import { getCookieName, getCookieOptions } from "./cookies";
import type { CookieConfig } from "../../../server/config";

describe("getCookieName", () => {
  const config: CookieConfig = {
    domain: "localhost",
    projectRef: "test-project",
  };

  it("should generate cookie name with projectRef and suffix", () => {
    const result = getCookieName(config, "access-token");
    expect(result).toBe("sb-test-project-access-token");
  });

  it("should generate cookie name for different suffixes", () => {
    expect(getCookieName(config, "refresh-token")).toBe(
      "sb-test-project-refresh-token",
    );
    expect(getCookieName(config, "code-verifier")).toBe(
      "sb-test-project-code-verifier",
    );
  });
});

describe("getCookieOptions", () => {
  const config: CookieConfig = {
    domain: "example.com",
    projectRef: "test-project",
  };

  it("should include secure flag when true", () => {
    const options = getCookieOptions(config, true);
    expect(options.secure).toBe(true);
    expect(options.httpOnly).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { getCookieName, getCookieOptions } from "./cookies";
import type { CookieConfig } from "../../../domain/config";

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
    domain: "localhost",
    projectRef: "test-project",
  };

  it("should return secure cookie options when secure is true", () => {
    const result = getCookieOptions(config, true);
    expect(result).toEqual({
      domain: "localhost",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax",
      secure: true,
      httpOnly: true,
    });
  });

  it("should return non-secure cookie options when secure is false", () => {
    const result = getCookieOptions(config, false);
    expect(result).toEqual({
      domain: "localhost",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax",
      secure: false,
      httpOnly: true,
    });
  });

  it("should use correct domain from config", () => {
    const customConfig: CookieConfig = {
      domain: "example.com",
      projectRef: "prod-project",
    };
    const result = getCookieOptions(customConfig, true);
    expect(result.domain).toBe("example.com");
  });
});

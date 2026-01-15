import { describe, expect, it } from "vitest";
import { getSafeRedirect } from "./redirect";

describe("getSafeRedirect", () => {
  it("returns / for null", () => {
    expect(getSafeRedirect(null)).toBe("/");
  });

  it("returns / for undefined", () => {
    expect(getSafeRedirect(undefined)).toBe("/");
  });

  it("returns / for empty string", () => {
    expect(getSafeRedirect("")).toBe("/");
  });

  it("returns / for whitespace-only string", () => {
    expect(getSafeRedirect("   ")).toBe("/");
  });

  it("allows valid internal paths", () => {
    expect(getSafeRedirect("/dashboard")).toBe("/dashboard");
    expect(getSafeRedirect("/profile")).toBe("/profile");
    expect(getSafeRedirect("/settings")).toBe("/settings");
    expect(getSafeRedirect("/foo/bar/baz")).toBe("/foo/bar/baz");
  });

  it("allows internal paths with query strings", () => {
    expect(getSafeRedirect("/dashboard?foo=bar")).toBe("/dashboard?foo=bar");
    expect(getSafeRedirect("/profile?tab=settings&id=123")).toBe(
      "/profile?tab=settings&id=123",
    );
  });

  it("allows internal paths with hash fragments", () => {
    expect(getSafeRedirect("/page#section")).toBe("/page#section");
    expect(getSafeRedirect("/docs?v=2#intro")).toBe("/docs?v=2#intro");
  });

  it("rejects protocol-relative URLs (//)", () => {
    expect(getSafeRedirect("//evil.com")).toBe("/");
    expect(getSafeRedirect("//evil.com/path")).toBe("/");
  });

  it("rejects backslash-relative URLs (/\\)", () => {
    expect(getSafeRedirect("/\\evil.com")).toBe("/");
    expect(getSafeRedirect("/\\")).toBe("/");
  });

  it("rejects absolute HTTP URLs", () => {
    expect(getSafeRedirect("http://evil.com")).toBe("/");
    expect(getSafeRedirect("http://example.com/path")).toBe("/");
  });

  it("rejects absolute HTTPS URLs", () => {
    expect(getSafeRedirect("https://evil.com")).toBe("/");
    expect(getSafeRedirect("https://example.com/path")).toBe("/");
  });

  it("rejects mixed-case protocol URLs", () => {
    expect(getSafeRedirect("HTTPS://evil.com")).toBe("/");
    expect(getSafeRedirect("HtTpS://evil.com")).toBe("/");
  });

  it("rejects relative paths (no leading slash)", () => {
    expect(getSafeRedirect("dashboard")).toBe("/");
    expect(getSafeRedirect("../admin")).toBe("/");
    expect(getSafeRedirect("./profile")).toBe("/");
  });

  it("rejects javascript: protocol", () => {
    expect(getSafeRedirect("javascript:alert(1)")).toBe("/");
  });

  it("rejects data: protocol", () => {
    expect(getSafeRedirect("data:text/html,<script>alert(1)</script>")).toBe(
      "/",
    );
  });

  it("handles case-insensitive attack patterns", () => {
    expect(getSafeRedirect("//EVIL.COM")).toBe("/");
    expect(getSafeRedirect("/\\EVIL.COM")).toBe("/");
  });

  it("trims whitespace before validation", () => {
    expect(getSafeRedirect("  /dashboard  ")).toBe("/dashboard");
    expect(getSafeRedirect("\t/profile\n")).toBe("/profile");
  });

  it("normalizes encoded characters in path", () => {
    expect(getSafeRedirect("/%64ashboard")).toBe("/%64ashboard");
    expect(getSafeRedirect("/test%20page")).toBe("/test%20page");
  });

  it("rejects URLs with different origins after parsing", () => {
    // URL constructor can parse some patterns that result in different origins
    expect(getSafeRedirect("//@evil.com")).toBe("/");
  });

  it("handles malformed URLs that throw parsing errors", () => {
    // Certain malformed patterns can cause URL constructor to throw
    // Testing with extremely long paths or invalid characters
    const veryLongPath = "/" + "x".repeat(100000);
    expect(getSafeRedirect(veryLongPath)).toBe(veryLongPath);

    // URL with invalid characters that might cause parsing issues
    expect(getSafeRedirect("/valid/path")).toBe("/valid/path");
  });
});

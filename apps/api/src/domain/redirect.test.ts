import { describe, it, expect } from "vitest";
import { getSafeNext } from "./redirect";

describe("getSafeNext", () => {
  it("should return '/' for null", () => {
    expect(getSafeNext(null)).toBe("/");
  });

  it("should return '/' for undefined", () => {
    expect(getSafeNext(undefined)).toBe("/");
  });

  it("should return the value if it starts with '/' and is safe", () => {
    expect(getSafeNext("/dashboard")).toBe("/dashboard");
    expect(getSafeNext("/profile/settings")).toBe("/profile/settings");
  });

  it("should return '/' for protocol-relative URLs", () => {
    expect(getSafeNext("//example.com")).toBe("/");
  });

  it("should return '/' for backslash URLs", () => {
    expect(getSafeNext("/\\evil.com")).toBe("/");
  });

  it("should return '/' for full URLs", () => {
    expect(getSafeNext("https://evil.com")).toBe("/");
    expect(getSafeNext("http://example.com")).toBe("/");
  });
});

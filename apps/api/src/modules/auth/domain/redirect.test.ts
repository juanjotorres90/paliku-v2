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

  it("should return '/' for unsafe values", () => {
    expect(getSafeNext("https://example.com")).toBe("/");
    expect(getSafeNext("//example.com")).toBe("/");
    expect(getSafeNext("/\\evil")).toBe("/");
  });
});

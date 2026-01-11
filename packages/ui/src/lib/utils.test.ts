import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn (classnames utility)", () => {
  it("merges class names", () => {
    const result = cn("foo", "bar");
    expect(result).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    const result = cn("base", true && "included", false && "excluded");
    expect(result).toBe("base included");
  });

  it("handles undefined and null values", () => {
    const result = cn("base", undefined, null, "end");
    expect(result).toBe("base end");
  });

  it("merges tailwind classes correctly", () => {
    const result = cn("px-2 py-1", "px-4");
    expect(result).toBe("py-1 px-4");
  });

  it("handles array of classes", () => {
    const result = cn(["foo", "bar"]);
    expect(result).toBe("foo bar");
  });

  it("handles object syntax", () => {
    const result = cn({ foo: true, bar: false, baz: true });
    expect(result).toBe("foo baz");
  });

  it("handles mixed inputs", () => {
    const result = cn("base", ["array-class"], { object: true });
    expect(result).toBe("base array-class object");
  });

  it("returns empty string for no inputs", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("returns empty string for all falsy inputs", () => {
    const result = cn(false, null, undefined, "");
    expect(result).toBe("");
  });

  it("handles tailwind conflict resolution", () => {
    // Later classes should override earlier conflicting ones
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });

  it("handles padding conflicts", () => {
    const result = cn("p-4", "px-2");
    expect(result).toBe("p-4 px-2");
  });

  it("handles margin conflicts", () => {
    const result = cn("m-4", "mt-2");
    expect(result).toBe("m-4 mt-2");
  });
});

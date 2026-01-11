import { describe, it, expect } from "vitest";
import { createPKCEHelpers } from "./crypto";

describe("createPKCEHelpers", () => {
  it("should create PKCEHelpers with randomBytes and createHash functions", () => {
    const pkceHelpers = createPKCEHelpers();

    expect(pkceHelpers).toHaveProperty("randomBytes");
    expect(pkceHelpers).toHaveProperty("createHash");
    expect(typeof pkceHelpers.randomBytes).toBe("function");
    expect(typeof pkceHelpers.createHash).toBe("function");
  });

  it("should generate random bytes", () => {
    const pkceHelpers = createPKCEHelpers();
    const bytes = pkceHelpers.randomBytes(32);

    expect(bytes).toBeInstanceOf(Buffer);
    expect(bytes.length).toBe(32);
  });

  it("should generate different random bytes on each call", () => {
    const pkceHelpers = createPKCEHelpers();
    const bytes1 = pkceHelpers.randomBytes(32);
    const bytes2 = pkceHelpers.randomBytes(32);

    expect(bytes1).not.toEqual(bytes2);
  });

  it("should create hash and digest", () => {
    const pkceHelpers = createPKCEHelpers();
    const hash = pkceHelpers.createHash("sha256");

    const digest = hash.update(Buffer.from("test data")).digest();

    expect(digest).toBeInstanceOf(Buffer);
    expect(digest.length).toBe(32); // SHA-256 produces 32 bytes
  });

  it("should create consistent hashes for same input", () => {
    const pkceHelpers = createPKCEHelpers();

    const hash1 = pkceHelpers.createHash("sha256");
    const digest1 = hash1.update(Buffer.from("test data")).digest();

    const hash2 = pkceHelpers.createHash("sha256");
    const digest2 = hash2.update(Buffer.from("test data")).digest();

    expect(digest1).toEqual(digest2);
  });

  it("should create different hashes for different inputs", () => {
    const pkceHelpers = createPKCEHelpers();

    const hash1 = pkceHelpers.createHash("sha256");
    const digest1 = hash1.update(Buffer.from("data1")).digest();

    const hash2 = pkceHelpers.createHash("sha256");
    const digest2 = hash2.update(Buffer.from("data2")).digest();

    expect(digest1).not.toEqual(digest2);
  });
});

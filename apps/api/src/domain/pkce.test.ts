/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect } from "vitest";
import { base64urlEncode, generateCodeChallenge } from "./pkce";

describe("base64urlEncode", () => {
  it("should encode buffer correctly", () => {
    const buffer = Buffer.from("test");
    const result = base64urlEncode(buffer);
    expect(result).toBe("dGVzdA");
  });

  it("should replace '+' with '-'", () => {
    const buffer = Buffer.from([251, 239]); // produces '++' in base64
    const result = base64urlEncode(buffer);
    expect(result).toContain("-");
    expect(result).not.toContain("+");
  });

  it("should replace '/' with '_'", () => {
    const buffer = Buffer.from([255, 255]); // produces '//' in base64
    const result = base64urlEncode(buffer);
    expect(result).toContain("_");
    expect(result).not.toContain("/");
  });

  it("should remove trailing '=' padding", () => {
    const buffer = Buffer.from("test");
    const result = base64urlEncode(buffer);
    expect(result).not.toContain("=");
  });
});

describe("generateCodeChallenge", () => {
  it("should generate code verifier and challenge", () => {
    const mockHelpers = {
      randomBytes: (size: number) => Buffer.alloc(size, "a"),
      createHash: (_algorithm: string) => ({
        update: (_data: Buffer) => ({
          digest: () => Buffer.alloc(32, "b"),
        }),
      }),
    };

    const result = generateCodeChallenge(mockHelpers);

    expect(result).toHaveProperty("codeVerifier");
    expect(result).toHaveProperty("codeChallenge");
    expect(typeof result.codeVerifier).toBe("string");
    expect(typeof result.codeChallenge).toBe("string");
  });

  it("should use randomBytes of 32 bytes", () => {
    let randomBytesSize = 0;
    const mockHelpers = {
      randomBytes: (size: number) => {
        randomBytesSize = size;
        return Buffer.alloc(size);
      },
      createHash: () => ({
        update: () => ({
          digest: () => Buffer.alloc(32),
        }),
      }),
    };

    generateCodeChallenge(mockHelpers);
    expect(randomBytesSize).toBe(32);
  });
});

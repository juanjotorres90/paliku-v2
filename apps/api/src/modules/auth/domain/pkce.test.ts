import { describe, it, expect, vi } from "vitest";
import { base64urlEncode, generateCodeChallenge } from "./pkce";

describe("base64urlEncode", () => {
  it("should encode buffer correctly", () => {
    const buffer = Buffer.from("test");
    const result = base64urlEncode(buffer);
    expect(result).toBe("dGVzdA");
  });

  it("should replace '+' with '-'", () => {
    const buffer = Buffer.from([251, 239]);
    const result = base64urlEncode(buffer);
    expect(result).toContain("-");
    expect(result).not.toContain("+");
  });
});

describe("generateCodeChallenge", () => {
  it("should return codeVerifier and codeChallenge", () => {
    const helpers = {
      randomBytes: vi.fn().mockReturnValue(Buffer.from("random-bytes")),
      createHash: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue(Buffer.from("hash-bytes")),
      }),
    };

    const result = generateCodeChallenge(helpers);

    expect(result.codeVerifier).toBeTruthy();
    expect(result.codeChallenge).toBeTruthy();
  });
});

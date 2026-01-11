import { describe, it, expect, vi } from "vitest";
import { me } from "./me";
import type { JWTVerifierPort } from "../ports";

describe("me", () => {
  it("should return user info from valid token", async () => {
    const mockJwtVerifier: JWTVerifierPort = {
      verify: vi.fn().mockResolvedValue({
        sub: "user-123",
        aud: "authenticated",
        role: "authenticated",
      }),
    };

    const result = await me(
      { token: "valid-token" },
      { jwtVerifier: mockJwtVerifier },
    );

    expect(result).toEqual({
      userId: "user-123",
      aud: "authenticated",
      role: "authenticated",
    });
    expect(mockJwtVerifier.verify).toHaveBeenCalledWith("valid-token");
  });

  it("should throw error when token has no sub claim", async () => {
    const mockJwtVerifier: JWTVerifierPort = {
      verify: vi.fn().mockResolvedValue({
        aud: "authenticated",
        role: "authenticated",
      }),
    };

    await expect(
      me({ token: "invalid-token" }, { jwtVerifier: mockJwtVerifier }),
    ).rejects.toThrow("Invalid token: missing subject");
  });

  it("should propagate errors from jwt verifier", async () => {
    const mockJwtVerifier: JWTVerifierPort = {
      verify: vi.fn().mockRejectedValue(new Error("Token expired")),
    };

    await expect(
      me({ token: "expired-token" }, { jwtVerifier: mockJwtVerifier }),
    ).rejects.toThrow("Token expired");
  });
});

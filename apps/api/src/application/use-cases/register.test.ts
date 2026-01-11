import { describe, it, expect, vi } from "vitest";
import { register } from "./register";
import type { SupabaseAuthPort } from "../ports";
import type { PKCEHelpers } from "../../domain/pkce";

describe("register", () => {
  const mockPKCEHelpers: PKCEHelpers = {
    randomBytes: vi.fn().mockReturnValue(Buffer.from("mock-random-bytes")),
    createHash: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue(Buffer.from("mock-hash")),
    }),
  };

  it("should successfully register a new user", async () => {
    const mockSupabaseAuth: SupabaseAuthPort = {
      signup: vi.fn().mockResolvedValue({ needsEmailConfirmation: true }),
      login: vi.fn(),
      refreshSession: vi.fn(),
      exchangeAuthCodeForTokens: vi.fn(),
      getUser: vi.fn(),
    };

    const result = await register(
      {
        email: "test@example.com",
        password: "password123",
        displayName: "Test User",
      },
      {
        supabaseAuth: mockSupabaseAuth,
        pkceHelpers: mockPKCEHelpers,
        apiOrigin: "http://localhost:3002",
      },
    );

    expect(result.ok).toBe(true);
    expect(result.needsEmailConfirmation).toBe(true);
    expect(result.codeVerifier).toBeDefined();
    expect(mockSupabaseAuth.signup).toHaveBeenCalled();
  });

  it("should handle custom redirectTo parameter", async () => {
    const mockSupabaseAuth: SupabaseAuthPort = {
      signup: vi.fn().mockResolvedValue({ needsEmailConfirmation: false }),
      login: vi.fn(),
      refreshSession: vi.fn(),
      exchangeAuthCodeForTokens: vi.fn(),
      getUser: vi.fn(),
    };

    const result = await register(
      {
        email: "test@example.com",
        password: "password123",
        displayName: "Test User",
        redirectTo: "/dashboard",
      },
      {
        supabaseAuth: mockSupabaseAuth,
        pkceHelpers: mockPKCEHelpers,
        apiOrigin: "http://localhost:3002",
      },
    );

    expect(result.ok).toBe(true);
    expect(result.needsEmailConfirmation).toBe(false);
    const signupCall = mockSupabaseAuth.signup as ReturnType<typeof vi.fn>;
    const emailRedirectTo = signupCall.mock.calls[0]![4];
    expect(emailRedirectTo).toContain("/auth/callback");
    expect(emailRedirectTo).toContain("next=%2Fdashboard");
  });

  it("should propagate errors from supabase auth", async () => {
    const mockSupabaseAuth: SupabaseAuthPort = {
      signup: vi.fn().mockRejectedValue(new Error("Email already registered")),
      login: vi.fn(),
      refreshSession: vi.fn(),
      exchangeAuthCodeForTokens: vi.fn(),
      getUser: vi.fn(),
    };

    await expect(
      register(
        {
          email: "test@example.com",
          password: "password123",
          displayName: "Test User",
        },
        {
          supabaseAuth: mockSupabaseAuth,
          pkceHelpers: mockPKCEHelpers,
          apiOrigin: "http://localhost:3002",
        },
      ),
    ).rejects.toThrow("Email already registered");
  });
});

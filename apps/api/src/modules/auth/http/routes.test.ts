import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { createAuthRoutes } from "./routes";
import type { RouteEnv } from "../../../http/context";
import type { AuthProviderPort } from "../application/ports";
import type { PKCEHelpers } from "../domain/pkce";
import type { AppConfig } from "../../../server/config";

describe("createAuthRoutes", () => {
  let mockContext: {
    config: AppConfig;
    authProvider: AuthProviderPort;
    pkceHelpers: PKCEHelpers;
  };

  beforeEach(() => {
    mockContext = {
      config: {
        supabase: {
          url: "https://example.supabase.co",
          anonKey: "anon-key",
          audience: "authenticated",
          jwtSecret: undefined,
          jwtAlgs: [],
        },
        cors: {
          allowedOrigins: ["http://localhost:3000"],
        },
        cookie: {
          domain: "localhost",
          projectRef: "test-project",
        },
      },
      pkceHelpers: {
        randomBytes: vi.fn().mockReturnValue(Buffer.from("mock-random")),
        createHash: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnThis(),
          digest: vi.fn().mockReturnValue(Buffer.from("mock-hash")),
        }),
      } as unknown as PKCEHelpers,
      authProvider: {
        signup: vi.fn(),
        login: vi.fn(),
        refreshSession: vi.fn(),
        exchangeAuthCodeForTokens: vi.fn(),
        getUser: vi.fn(),
      } as unknown as AuthProviderPort,
    };
  });

  it("should return 400 for invalid JSON", async () => {
    const app = new Hono<RouteEnv>();
    app.route("/auth", createAuthRoutes(mockContext));

    const res = await app.request("/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
        "X-Forwarded-For": "192.168.1.1",
      },
      body: "invalid json",
    });

    expect(res.status).toBe(400);
  });

  it("should register successfully", async () => {
    (
      mockContext.authProvider.signup as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      needsEmailConfirmation: true,
    });

    const app = new Hono<RouteEnv>();
    app.route("/auth", createAuthRoutes(mockContext));

    const res = await app.request("/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
        "X-Forwarded-For": "192.168.1.3",
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
        displayName: "Test User",
      }),
    });

    expect(res.status).toBe(200);
    const cookies = res.headers.get("set-cookie");
    expect(cookies).toContain("sb-test-project-code-verifier");
  });

  it("should refresh session", async () => {
    (
      mockContext.authProvider.refreshSession as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });

    const app = new Hono<RouteEnv>();
    app.route("/auth", createAuthRoutes(mockContext));

    const res = await app.request("/auth/refresh", {
      method: "POST",
      headers: {
        Origin: "http://localhost:3000",
        Cookie: "sb-test-project-refresh-token=refresh-token",
      },
    });

    expect(res.status).toBe(200);
  });
});

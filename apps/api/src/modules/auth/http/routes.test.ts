import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { createAuthRoutes } from "./routes";
import type { RouteEnv } from "../../../http/context";
import type { AuthProviderPort } from "../application/ports";
import type { PKCEHelpers } from "../domain/pkce";
import type { AppConfig } from "../../../server/config";
import type { SettingsRepositoryPort } from "../../settings/application/ports";

describe("createAuthRoutes", () => {
  let mockContext: {
    config: AppConfig;
    authProvider: AuthProviderPort;
    pkceHelpers: PKCEHelpers;
    settingsRepo: SettingsRepositoryPort;
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
      settingsRepo: {
        getById: vi.fn(),
        updateById: vi.fn(),
      } as unknown as SettingsRepositoryPort,
    };
  });

  function base64UrlEncode(value: string): string {
    return Buffer.from(value)
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  }

  function createFakeJwt(payload: Record<string, unknown>): string {
    const header = base64UrlEncode(JSON.stringify({ alg: "none", typ: "JWT" }));
    const body = base64UrlEncode(JSON.stringify(payload));
    return `${header}.${body}.sig`;
  }

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

  it("should persist browser locale to user settings on first login", async () => {
    const userId = "11111111-1111-1111-1111-111111111111";
    const token = createFakeJwt({ sub: userId });

    (
      mockContext.authProvider.login as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      accessToken: token,
      refreshToken: undefined,
    });

    // Mock returns locale "en" (DEFAULT_LOCALE) to simulate a user on the default locale.
    // The logic only updates if the user is still on the default locale.
    (
      mockContext.settingsRepo.getById as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      userId,
      theme: "system",
      locale: "en",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    (
      mockContext.settingsRepo.updateById as ReturnType<typeof vi.fn>
    ).mockResolvedValue({
      userId,
      theme: "system",
      locale: "es",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const app = new Hono<RouteEnv>();
    // Simulate i18n middleware setting request locale from the browser.
    app.use("*", async (c, next) => {
      c.set("locale", "es");
      await next();
    });
    app.route("/auth", createAuthRoutes(mockContext));

    const res = await app.request("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
        "X-Forwarded-For": "192.168.1.2",
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });

    expect(res.status).toBe(200);
    expect(mockContext.settingsRepo.updateById).toHaveBeenCalledWith({
      userId,
      accessToken: token,
      data: { locale: "es" },
    });
  });
});

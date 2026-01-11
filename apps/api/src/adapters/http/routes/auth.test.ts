import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { createAuthRoutes } from "./auth";
import type { RouteContext, RouteEnv } from "../context";
import type {
  JWTVerifierPort,
  SupabaseAuthPort,
} from "../../../application/ports";
import type { HttpClient } from "../../../adapters/http-client";
import type { PKCEHelpers } from "../../../domain/pkce";
import * as useCases from "../../../application/index";

describe("createAuthRoutes", () => {
  let mockContext: RouteContext;

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
      jwtVerifier: {
        verify: vi.fn(),
      } as unknown as JWTVerifierPort,
      useCases,
      pkceHelpers: {
        randomBytes: vi.fn().mockReturnValue(Buffer.from("mock-random")),
        createHash: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnThis(),
          digest: vi.fn().mockReturnValue(Buffer.from("mock-hash")),
        }),
      } as unknown as PKCEHelpers,
      supabaseAuth: {
        signup: vi.fn(),
        login: vi.fn(),
        refreshSession: vi.fn(),
        exchangeAuthCodeForTokens: vi.fn(),
        getUser: vi.fn(),
      } as unknown as SupabaseAuthPort,
      httpClient: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
      } as unknown as HttpClient,
      storageClient: {
        upload: vi.fn(),
      },
    };
  });

  describe("POST /register", () => {
    it("should return 400 for invalid JSON", async () => {
      const app = new Hono<RouteEnv>();
      app.route("/auth", createAuthRoutes(mockContext));

      const res = await app.request("/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: "invalid json",
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty("error");
    });

    it("should return 400 for invalid request schema", async () => {
      const app = new Hono<RouteEnv>();
      app.route("/auth", createAuthRoutes(mockContext));

      const res = await app.request("/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({ invalid: "data" }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty("error");
    });

    it("should register successfully", async () => {
      (
        mockContext.supabaseAuth.signup as ReturnType<typeof vi.fn>
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
        },
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
          displayName: "Test User",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ ok: true, needsEmailConfirmation: true });
      expect(res.headers.get("set-cookie")).toContain(
        "sb-test-project-code-verifier",
      );
    });

    it("should handle registration errors", async () => {
      (
        mockContext.supabaseAuth.signup as ReturnType<typeof vi.fn>
      ).mockRejectedValue(new Error("Email already registered"));

      const app = new Hono<RouteEnv>();
      app.route("/auth", createAuthRoutes(mockContext));

      const res = await app.request("/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
          displayName: "Test User",
        }),
      });

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBe("Email already registered");
    });
  });

  describe("POST /login", () => {
    it("should return 400 for invalid JSON", async () => {
      const app = new Hono<RouteEnv>();
      app.route("/auth", createAuthRoutes(mockContext));

      const res = await app.request("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: "invalid json",
      });

      expect(res.status).toBe(400);
    });

    it("should login successfully", async () => {
      (
        mockContext.supabaseAuth.login as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      const app = new Hono<RouteEnv>();
      app.route("/auth", createAuthRoutes(mockContext));

      const res = await app.request("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ ok: true });

      const cookies = res.headers.get("set-cookie");
      expect(cookies).toContain("sb-test-project-access-token");
      expect(cookies).toContain("sb-test-project-refresh-token");
    });

    it("should handle login errors", async () => {
      (
        mockContext.supabaseAuth.login as ReturnType<typeof vi.fn>
      ).mockRejectedValue(new Error("Invalid credentials"));

      const app = new Hono<RouteEnv>();
      app.route("/auth", createAuthRoutes(mockContext));

      const res = await app.request("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          email: "test@example.com",
          password: "wrongpassword",
        }),
      });

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBe("Invalid credentials");
    });

    it("should return 400 for invalid request schema", async () => {
      const app = new Hono<RouteEnv>();
      app.route("/auth", createAuthRoutes(mockContext));

      const res = await app.request("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          invalid: "data",
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data).toHaveProperty("error");
    });
  });

  describe("POST /refresh", () => {
    it("should return 401 when refresh token cookie is missing", async () => {
      const app = new Hono<RouteEnv>();
      app.route("/auth", createAuthRoutes(mockContext));

      const res = await app.request("/auth/refresh", {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
        },
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data).toHaveProperty("error");
    });

    it("should refresh successfully and set new cookies", async () => {
      (
        mockContext.supabaseAuth.refreshSession as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
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
      const data = await res.json();
      expect(data).toEqual({ ok: true });

      const cookies = res.headers.get("set-cookie");
      expect(cookies).toContain("sb-test-project-access-token");
      expect(cookies).toContain("sb-test-project-refresh-token");
    });

    it("should clear cookies and return 401 when refresh fails", async () => {
      (
        mockContext.supabaseAuth.refreshSession as ReturnType<typeof vi.fn>
      ).mockRejectedValue(new Error("Invalid refresh token"));

      const app = new Hono<RouteEnv>();
      app.route("/auth", createAuthRoutes(mockContext));

      const res = await app.request("/auth/refresh", {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
          Cookie: "sb-test-project-refresh-token=refresh-token",
        },
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Invalid refresh token");

      const cookies = res.headers.get("set-cookie");
      expect(cookies).toContain("sb-test-project-access-token=");
      expect(cookies).toContain("sb-test-project-refresh-token=");
    });
  });

  describe("POST /signout", () => {
    it("should signout successfully", async () => {
      const app = new Hono<RouteEnv>();
      app.route("/auth", createAuthRoutes(mockContext));

      const res = await app.request("/auth/signout", {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ ok: true });

      const cookies = res.headers.get("set-cookie");
      expect(cookies).toBeTruthy();
    });
  });

  describe("GET /callback", () => {
    it("should return 400 when code is missing", async () => {
      const app = new Hono<RouteEnv>();
      app.route("/auth", createAuthRoutes(mockContext));

      const res = await app.request("/auth/callback");

      expect(res.status).toBe(400);
      expect(await res.text()).toBe("Missing code");
    });

    it("should redirect with error when code verifier is missing", async () => {
      const app = new Hono<RouteEnv>();
      app.route("/auth", createAuthRoutes(mockContext));

      const res = await app.request("/auth/callback?code=auth-code", {
        headers: {
          Origin: "http://localhost:3000",
        },
      });

      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toContain("error=invalid_state");
    });

    it("should exchange code for tokens and redirect", async () => {
      (
        mockContext.supabaseAuth.exchangeAuthCodeForTokens as ReturnType<
          typeof vi.fn
        >
      ).mockResolvedValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      const app = new Hono<RouteEnv>();
      app.route("/auth", createAuthRoutes(mockContext));

      const res = await app.request("/auth/callback?code=auth-code", {
        headers: {
          Origin: "http://localhost:3000",
          Cookie: "sb-test-project-code-verifier=code-verifier-value",
        },
      });

      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toContain("http://localhost:3000");
      expect(res.headers.get("location")).not.toContain("error");
    });

    it("should handle callback errors", async () => {
      (
        mockContext.supabaseAuth.exchangeAuthCodeForTokens as ReturnType<
          typeof vi.fn
        >
      ).mockRejectedValue(new Error("Invalid code"));

      const app = new Hono<RouteEnv>();
      app.route("/auth", createAuthRoutes(mockContext));

      const res = await app.request("/auth/callback?code=bad-code", {
        headers: {
          Origin: "http://localhost:3000",
          Cookie: "sb-test-project-code-verifier=code-verifier-value",
        },
      });

      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toContain("error");
    });

    it("should handle custom next parameter", async () => {
      (
        mockContext.supabaseAuth.exchangeAuthCodeForTokens as ReturnType<
          typeof vi.fn
        >
      ).mockResolvedValue({
        accessToken: "access-token",
        refreshToken: "refresh-token",
      });

      const app = new Hono<RouteEnv>();
      app.route("/auth", createAuthRoutes(mockContext));

      const res = await app.request(
        "/auth/callback?code=auth-code&next=/dashboard",
        {
          headers: {
            Origin: "http://localhost:3000",
            Cookie: "sb-test-project-code-verifier=code-verifier-value",
          },
        },
      );

      expect(res.status).toBe(302);
      const location = res.headers.get("location");
      expect(location).toContain("/dashboard");
    });
  });
});

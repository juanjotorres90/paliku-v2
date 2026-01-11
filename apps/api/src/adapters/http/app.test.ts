import { describe, it, expect, vi } from "vitest";
import { createHttpApp } from "./app";
import type { RouteContext } from "./context";
import type {
  JWTVerifierPort,
  SupabaseAuthPort,
} from "../../application/ports";
import type { HttpClient } from "../../adapters/http-client";
import type { StorageClient } from "../../adapters/storage-client";
import type { PKCEHelpers } from "../../domain/pkce";
import * as useCases from "../../application/index";

describe("createHttpApp", () => {
  const mockContext: RouteContext = {
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
      randomBytes: vi.fn(),
      createHash: vi.fn(),
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
    } as unknown as StorageClient,
  };

  it("should create app with root endpoint", async () => {
    const app = createHttpApp(mockContext);

    const res = await app.request("/");

    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ok");
  });

  it("should have CORS enabled", async () => {
    const app = createHttpApp(mockContext);

    const res = await app.request("/", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
      },
    });

    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe(
      "http://localhost:3000",
    );
  });

  it("should mount /auth routes", async () => {
    const app = createHttpApp(mockContext);

    // Test that /auth/signout exists
    const res = await app.request("/auth/signout", {
      method: "POST",
      headers: {
        Origin: "http://localhost:3000",
      },
    });

    // Will succeed because signout doesn't require auth
    expect(res.status).toBe(200);
  });

  it("should mount /me routes with auth middleware", async () => {
    const app = createHttpApp(mockContext);

    // Test that /me requires auth
    const res = await app.request("/me");

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data).toHaveProperty("error");
  });

  it("should mount /profile routes", async () => {
    const app = createHttpApp(mockContext);

    // Test that /profile/me exists and requires auth
    const res = await app.request("/profile/me");

    expect(res.status).toBe(401);
  });

  it("should handle CORS preflight", async () => {
    const app = createHttpApp(mockContext);

    const res = await app.request("/auth/login", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
      },
    });

    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-methods")).toContain("POST");
  });

  it("should reject requests from disallowed origins", async () => {
    const app = createHttpApp(mockContext);

    const res = await app.request("/", {
      headers: {
        Origin: "http://evil.com",
      },
    });

    const corsHeader = res.headers.get("access-control-allow-origin");
    expect(corsHeader).not.toBe("http://evil.com");
  });
});

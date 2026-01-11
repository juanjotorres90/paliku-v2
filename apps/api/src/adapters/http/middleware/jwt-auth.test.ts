import { describe, it, expect, vi } from "vitest";
import { Hono } from "hono";
import { createJwtAuth } from "./jwt-auth";
import type { JWTVerifierPort } from "../../../application/ports";
import type { CookieConfig } from "../../../domain/config";
import type { RouteEnv } from "../context";

describe("createJwtAuth", () => {
  const cookieConfig: CookieConfig = {
    domain: "localhost",
    projectRef: "test-project",
  };

  it("should skip authentication for OPTIONS requests", async () => {
    const mockJwtVerifier: JWTVerifierPort = {
      verify: vi.fn(),
    };

    const app = new Hono<RouteEnv>();
    const middleware = createJwtAuth(mockJwtVerifier, cookieConfig);

    app.use("*", middleware);
    app.get("/test", (c) => c.json({ ok: true }));

    const res = await app.request("/test", { method: "OPTIONS" });

    expect(res.status).toBe(204);
    expect(mockJwtVerifier.verify).not.toHaveBeenCalled();
  });

  it("should authenticate with Bearer token from Authorization header", async () => {
    const mockJwtVerifier: JWTVerifierPort = {
      verify: vi
        .fn()
        .mockResolvedValue({ sub: "user-123", aud: "authenticated" }),
    };

    const app = new Hono<RouteEnv>();
    const middleware = createJwtAuth(mockJwtVerifier, cookieConfig);

    app.use("*", middleware);
    app.get("/test", (c) => {
      const payload = c.get("jwtPayload");
      const token = c.get("accessToken");
      return c.json({ payload, token });
    });

    const res = await app.request("/test", {
      headers: { Authorization: "Bearer test-token-123" },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.payload).toEqual({ sub: "user-123", aud: "authenticated" });
    expect(data.token).toBe("test-token-123");
    expect(mockJwtVerifier.verify).toHaveBeenCalledWith("test-token-123");
  });

  it("should authenticate with token from cookie", async () => {
    const mockJwtVerifier: JWTVerifierPort = {
      verify: vi
        .fn()
        .mockResolvedValue({ sub: "user-456", aud: "authenticated" }),
    };

    const app = new Hono<RouteEnv>();
    const middleware = createJwtAuth(mockJwtVerifier, cookieConfig);

    app.use("*", middleware);
    app.get("/test", (c) => c.json({ ok: true }));

    const res = await app.request("/test", {
      headers: {
        Cookie: "sb-test-project-access-token=cookie-token-456",
      },
    });

    expect(res.status).toBe(200);
    expect(mockJwtVerifier.verify).toHaveBeenCalledWith("cookie-token-456");
  });

  it("should return 401 when no token is provided", async () => {
    const mockJwtVerifier: JWTVerifierPort = {
      verify: vi.fn(),
    };

    const app = new Hono<RouteEnv>();
    const middleware = createJwtAuth(mockJwtVerifier, cookieConfig);

    app.use("*", middleware);
    app.get("/test", (c) => c.json({ ok: true }));

    const res = await app.request("/test");

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data).toEqual({ error: "Missing authentication token" });
    expect(mockJwtVerifier.verify).not.toHaveBeenCalled();
  });

  it("should return 401 when token is invalid", async () => {
    const mockJwtVerifier: JWTVerifierPort = {
      verify: vi.fn().mockRejectedValue(new Error("Invalid token")),
    };

    const app = new Hono<RouteEnv>();
    const middleware = createJwtAuth(mockJwtVerifier, cookieConfig);

    app.use("*", middleware);
    app.get("/test", (c) => c.json({ ok: true }));

    const res = await app.request("/test", {
      headers: { Authorization: "Bearer invalid-token" },
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data).toEqual({ error: "Invalid token" });
    expect(mockJwtVerifier.verify).toHaveBeenCalledWith("invalid-token");
  });

  it("should return 401 when token has no sub claim", async () => {
    const mockJwtVerifier: JWTVerifierPort = {
      verify: vi.fn().mockResolvedValue({ aud: "authenticated" }),
    };

    const app = new Hono<RouteEnv>();
    const middleware = createJwtAuth(mockJwtVerifier, cookieConfig);

    app.use("*", middleware);
    app.get("/test", (c) => c.json({ ok: true }));

    const res = await app.request("/test", {
      headers: { Authorization: "Bearer no-sub-token" },
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data).toEqual({ error: "Invalid token" });
  });

  it("should handle Bearer token with extra whitespace", async () => {
    const mockJwtVerifier: JWTVerifierPort = {
      verify: vi
        .fn()
        .mockResolvedValue({ sub: "user-789", aud: "authenticated" }),
    };

    const app = new Hono<RouteEnv>();
    const middleware = createJwtAuth(mockJwtVerifier, cookieConfig);

    app.use("*", middleware);
    app.get("/test", (c) => c.json({ ok: true }));

    const res = await app.request("/test", {
      headers: { Authorization: "Bearer   token-with-spaces  " },
    });

    expect(res.status).toBe(200);
    expect(mockJwtVerifier.verify).toHaveBeenCalledWith("token-with-spaces");
  });
});

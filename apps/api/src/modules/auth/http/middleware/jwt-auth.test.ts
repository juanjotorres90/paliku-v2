import { describe, it, expect, vi } from "vitest";
import { Hono } from "hono";
import { createJwtAuth } from "./jwt-auth";
import type { JWTVerifierPort } from "../../application/ports";
import type { CookieConfig } from "../../../../server/config";
import type { RouteEnv } from "../../../../http/context";

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
    app.use("*", createJwtAuth(mockJwtVerifier, cookieConfig));
    app.options("/", (c) => c.text("ok"));

    const res = await app.request("/", { method: "OPTIONS" });

    expect(res.status).toBe(204);
  });

  it("should reject requests without token", async () => {
    const mockJwtVerifier: JWTVerifierPort = {
      verify: vi.fn(),
    };

    const app = new Hono<RouteEnv>();
    app.use("*", createJwtAuth(mockJwtVerifier, cookieConfig));
    app.get("/", (c) => c.json({ ok: true }));

    const res = await app.request("/");

    expect(res.status).toBe(401);
  });

  it("should accept valid bearer token", async () => {
    const mockJwtVerifier: JWTVerifierPort = {
      verify: vi.fn().mockResolvedValue({ sub: "user-123" }),
    };

    const app = new Hono<RouteEnv>();
    app.use("*", createJwtAuth(mockJwtVerifier, cookieConfig));
    app.get("/", (c) => c.json({ ok: true }));

    const res = await app.request("/", {
      headers: { Authorization: "Bearer token-123" },
    });

    expect(res.status).toBe(200);
    expect(mockJwtVerifier.verify).toHaveBeenCalledWith("token-123");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { createMeRoutes } from "./me";
import type { RouteEnv } from "../context";

describe("createMeRoutes", () => {
  it("should return user info for valid JWT", async () => {
    const mockJwtAuth = vi.fn(async (c, next) => {
      c.set("jwtPayload", {
        sub: "user-123",
        aud: "authenticated",
        role: "authenticated",
      });
      await next();
    });

    const app = new Hono<RouteEnv>();
    app.route("/me", createMeRoutes(mockJwtAuth));

    const res = await app.request("/me");

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({
      userId: "user-123",
      aud: "authenticated",
      role: "authenticated",
    });
  });

  it("should return 401 when payload has no sub", async () => {
    const mockJwtAuth = vi.fn(async (c, next) => {
      c.set("jwtPayload", {
        aud: "authenticated",
        role: "authenticated",
      });
      await next();
    });

    const app = new Hono<RouteEnv>();
    app.route("/me", createMeRoutes(mockJwtAuth));

    const res = await app.request("/me");

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data).toEqual({ error: "Invalid token" });
  });

  it("should apply middleware to all routes", async () => {
    const mockJwtAuth = vi.fn(async (c) => {
      return c.json({ error: "Unauthorized" }, 401);
    });

    const app = new Hono<RouteEnv>();
    app.route("/me", createMeRoutes(mockJwtAuth));

    const res = await app.request("/me");

    expect(mockJwtAuth).toHaveBeenCalled();
    expect(res.status).toBe(401);
  });
});

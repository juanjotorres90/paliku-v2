import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Hono } from "hono";
import { createRateLimiter } from "./rate-limiter";
import type { RouteEnv } from "../context";

describe("createRateLimiter", () => {
  let app: Hono<RouteEnv>;
  let mockRandom: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    app = new Hono<RouteEnv>();
    mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    mockRandom.mockRestore();
  });

  it("allows requests within limit", async () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    app.use("*", limiter);
    app.get("/", (c) => c.json({ ok: true }));

    const res1 = await app.request("/", {
      headers: { "X-Forwarded-For": "1.2.3.4" },
    });
    const res2 = await app.request("/", {
      headers: { "X-Forwarded-For": "1.2.3.4" },
    });

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
  });

  it("rejects when limit exceeded", async () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    app.use("*", limiter);
    app.get("/", (c) => c.json({ ok: true }));

    await app.request("/", { headers: { "X-Forwarded-For": "5.6.7.8" } });
    const res = await app.request("/", {
      headers: { "X-Forwarded-For": "5.6.7.8" },
    });

    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data).toHaveProperty("retryAfter");
  });
});

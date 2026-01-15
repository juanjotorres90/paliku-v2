import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import { createRateLimiter } from "./rate-limiter";
import type { RouteEnv } from "../context";

describe("createRateLimiter", () => {
  let app: Hono<RouteEnv>;
  let mockRandom: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    app = new Hono<RouteEnv>();
    // Mock Math.random to control cleanup trigger
    mockRandom = vi.spyOn(Math, "random");
  });

  afterEach(() => {
    mockRandom.mockRestore();
  });

  it("allows requests within limit", async () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 1000 });
    app.use("/test", limiter);
    app.get("/test", (c) => c.json({ success: true }));

    const res = await app.request("/test", {
      headers: { "X-Forwarded-For": "192.168.1.1" },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ success: true });
  });

  it("blocks requests exceeding limit", async () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 60000 });
    app.use("/test", limiter);
    app.get("/test", (c) => c.json({ success: true }));

    const headers = { "X-Forwarded-For": "192.168.1.2" };

    // First request - allowed
    const res1 = await app.request("/test", { headers });
    expect(res1.status).toBe(200);

    // Second request - allowed
    const res2 = await app.request("/test", { headers });
    expect(res2.status).toBe(200);

    // Third request - blocked
    const res3 = await app.request("/test", { headers });
    expect(res3.status).toBe(429);
    const data = await res3.json();
    expect(data).toHaveProperty("error");
    expect(data).toHaveProperty("retryAfter");
    expect(typeof data.retryAfter).toBe("number");
  });

  it("resets counter after window expires", async () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 100 });
    app.use("/test", limiter);
    app.get("/test", (c) => c.json({ success: true }));

    const headers = { "X-Forwarded-For": "192.168.1.3" };

    // First request - allowed
    const res1 = await app.request("/test", { headers });
    expect(res1.status).toBe(200);

    // Second request - blocked
    const res2 = await app.request("/test", { headers });
    expect(res2.status).toBe(429);

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Third request after window - allowed (counter reset)
    const res3 = await app.request("/test", { headers });
    expect(res3.status).toBe(200);
  });

  it("uses different limits for different IPs", async () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    app.use("/test", limiter);
    app.get("/test", (c) => c.json({ success: true }));

    // First IP - allowed
    const res1 = await app.request("/test", {
      headers: { "X-Forwarded-For": "192.168.1.4" },
    });
    expect(res1.status).toBe(200);

    // Different IP - allowed (separate counter)
    const res2 = await app.request("/test", {
      headers: { "X-Forwarded-For": "192.168.1.5" },
    });
    expect(res2.status).toBe(200);
  });

  it("uses CF-Connecting-IP header if available", async () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    app.use("/test", limiter);
    app.get("/test", (c) => c.json({ success: true }));

    const res1 = await app.request("/test", {
      headers: { "CF-Connecting-IP": "10.0.0.1" },
    });
    expect(res1.status).toBe(200);

    const res2 = await app.request("/test", {
      headers: { "CF-Connecting-IP": "10.0.0.1" },
    });
    expect(res2.status).toBe(429);
  });

  it("falls back to X-Real-IP if X-Forwarded-For is not available", async () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    app.use("/test", limiter);
    app.get("/test", (c) => c.json({ success: true }));

    const res1 = await app.request("/test", {
      headers: { "X-Real-IP": "172.16.0.1" },
    });
    expect(res1.status).toBe(200);

    const res2 = await app.request("/test", {
      headers: { "X-Real-IP": "172.16.0.1" },
    });
    expect(res2.status).toBe(429);
  });

  it("uses 'unknown' as fallback IP", async () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    app.use("/test", limiter);
    app.get("/test", (c) => c.json({ success: true }));

    const res1 = await app.request("/test");
    expect(res1.status).toBe(200);

    const res2 = await app.request("/test");
    expect(res2.status).toBe(429);
  });

  it("triggers cleanup of expired entries", async () => {
    // Force cleanup to always run
    mockRandom.mockReturnValue(0.005); // < 0.01

    const limiter = createRateLimiter({ limit: 10, windowMs: 50 });
    app.use("/test", limiter);
    app.get("/test", (c) => c.json({ success: true }));

    // Create an entry that will expire
    await app.request("/test", {
      headers: { "X-Forwarded-For": "192.168.1.100" },
    });

    // Wait for it to expire
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Make another request to trigger cleanup
    const res = await app.request("/test", {
      headers: { "X-Forwarded-For": "192.168.1.101" },
    });
    expect(res.status).toBe(200);
  });

  it("handles multiple comma-separated IPs in X-Forwarded-For", async () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    app.use("/test", limiter);
    app.get("/test", (c) => c.json({ success: true }));

    // First IP in the list should be used
    const res1 = await app.request("/test", {
      headers: { "X-Forwarded-For": "203.0.113.1, 198.51.100.1" },
    });
    expect(res1.status).toBe(200);

    const res2 = await app.request("/test", {
      headers: { "X-Forwarded-For": "203.0.113.1, 198.51.100.2" },
    });
    expect(res2.status).toBe(429);
  });
});

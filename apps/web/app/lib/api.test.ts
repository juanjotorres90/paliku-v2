import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { ErrorCode } from "@repo/validators/error-codes";

function jsonResponse(body: unknown, init: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

async function tick() {
  await new Promise((r) => setTimeout(r, 0));
}

describe("apiFetchWithRefresh", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("signs out and redirects to login when a /me endpoint returns token_invalid", async () => {
    window.history.pushState({}, "", "/settings?tab=profile");

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/api/profile/me")) {
        return jsonResponse(
          {
            error: "Invalid or expired token",
            code: ErrorCode.AUTH_TOKEN_INVALID,
          },
          { status: 401 },
        );
      }
      if (url.endsWith("/api/auth/refresh")) {
        return jsonResponse(
          {
            error: "Invalid or expired token",
            code: ErrorCode.AUTH_TOKEN_INVALID,
          },
          { status: 401 },
        );
      }
      if (url.endsWith("/api/auth/signout")) {
        return jsonResponse({ ok: true }, { status: 200 });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { apiFetchWithRefresh } = await import("./api");
    await apiFetchWithRefresh("/profile/me");
    await tick();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/signout",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
    expect(window.location.pathname).toBe("/login");
    expect(window.location.search).toContain(
      `redirect=${encodeURIComponent("/settings?tab=profile")}`,
    );
  });

  it("does not sign out on /me 401s that aren't token_invalid", async () => {
    window.history.pushState({}, "", "/settings");

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/api/settings/me")) {
        return jsonResponse(
          {
            error: "Missing authentication token",
            code: ErrorCode.AUTH_MISSING_TOKEN,
          },
          { status: 401 },
        );
      }
      if (url.endsWith("/api/auth/refresh")) {
        return jsonResponse(
          {
            error: "Missing refresh token",
            code: ErrorCode.AUTH_MISSING_REFRESH_TOKEN,
          },
          { status: 401 },
        );
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { apiFetchWithRefresh } = await import("./api");
    await apiFetchWithRefresh("/settings/me");
    await tick();

    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/auth/signout",
      expect.anything(),
    );
    expect(window.location.pathname).toBe("/settings");
  });

  it("does not sign out for non-/me endpoints", async () => {
    window.history.pushState({}, "", "/profile/settings");

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/api/profile/avatar")) {
        return jsonResponse(
          {
            error: "Invalid or expired token",
            code: ErrorCode.AUTH_TOKEN_INVALID,
          },
          { status: 401 },
        );
      }
      if (url.endsWith("/api/auth/refresh")) {
        return jsonResponse(
          {
            error: "Invalid or expired token",
            code: ErrorCode.AUTH_TOKEN_INVALID,
          },
          { status: 401 },
        );
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { apiFetchWithRefresh } = await import("./api");
    await apiFetchWithRefresh("/profile/avatar");
    await tick();

    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/auth/signout",
      expect.anything(),
    );
    expect(window.location.pathname).toBe("/profile/settings");
  });
});

import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from "vitest";
import { createFetchHttpClient } from "./http-client";

describe("createFetchHttpClient", () => {
  let fetchMock: Mock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should make POST requests", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue('{"success":true}'),
    };

    fetchMock.mockResolvedValue(mockResponse);

    const client = createFetchHttpClient();
    const result = await client.post(
      "https://example.com/api",
      { key: "value" },
      { "Content-Type": "application/json" },
    );

    expect(fetchMock).toHaveBeenCalledWith("https://example.com/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "value" }),
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    await expect(result.text()).resolves.toBe('{"success":true}');
  });

  it("should make GET requests", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue('{"data":"value"}'),
    };

    fetchMock.mockResolvedValue(mockResponse);

    const client = createFetchHttpClient();
    const result = await client.get("https://example.com/api", {
      Authorization: "Bearer token",
    });

    expect(fetchMock).toHaveBeenCalledWith("https://example.com/api", {
      method: "GET",
      headers: { Authorization: "Bearer token" },
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    await expect(result.text()).resolves.toBe('{"data":"value"}');
  });

  it("should make PATCH requests", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue('{"updated":true}'),
    };

    fetchMock.mockResolvedValue(mockResponse);

    const client = createFetchHttpClient();
    const result = await client.patch(
      "https://example.com/api",
      { field: "new value" },
      { "Content-Type": "application/json" },
    );

    expect(fetchMock).toHaveBeenCalledWith("https://example.com/api", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field: "new value" }),
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    await expect(result.text()).resolves.toBe('{"updated":true}');
  });

  it("should handle failed POST requests", async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue('{"error":"Bad request"}'),
    };

    fetchMock.mockResolvedValue(mockResponse);

    const client = createFetchHttpClient();
    const result = await client.post(
      "https://example.com/api",
      { invalid: "data" },
      {},
    );

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });

  it("should handle failed GET requests", async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      text: vi.fn().mockResolvedValue("Not found"),
    };

    fetchMock.mockResolvedValue(mockResponse);

    const client = createFetchHttpClient();
    const result = await client.get("https://example.com/api/notfound", {});

    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
  });

  it("should handle failed PATCH requests", async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue("Internal server error"),
    };

    fetchMock.mockResolvedValue(mockResponse);

    const client = createFetchHttpClient();
    const result = await client.patch("https://example.com/api", {}, {});

    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
  });
});

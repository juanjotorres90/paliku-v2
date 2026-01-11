import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from "vitest";
import { createStorageClient } from "./storage-client";

describe("createStorageClient", () => {
  let fetchMock: Mock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should upload file successfully", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue('{"success":true}'),
    };

    fetchMock.mockResolvedValue(mockResponse);

    const client = createStorageClient(
      "https://example.supabase.co",
      "anon-key",
    );

    const mockFile = new File(["content"], "test.jpg", { type: "image/jpeg" });

    const result = await client.upload(
      "avatars",
      "user-123/avatar.jpg",
      mockFile,
      "access-token",
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.supabase.co/storage/v1/object/avatars/user-123/avatar.jpg",
      {
        method: "POST",
        headers: {
          apikey: "anon-key",
          Authorization: "Bearer access-token",
          "Content-Type": "image/jpeg",
        },
        body: mockFile,
      },
    );

    expect(result.url).toBe(
      "https://example.supabase.co/storage/v1/object/public/avatars/user-123/avatar.jpg",
    );
  });

  it("should use default content type when file type is not specified", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue("{}"),
    };

    fetchMock.mockResolvedValue(mockResponse);

    const client = createStorageClient(
      "https://example.supabase.co",
      "anon-key",
    );

    const mockFile = new File(["content"], "test.bin", { type: "" });

    await client.upload("files", "path/file.bin", mockFile, "token");

    const fetchCall = fetchMock.mock.calls[0];
    expect(fetchCall![1].headers["Content-Type"]).toBe(
      "application/octet-stream",
    );
  });

  it("should throw error when upload fails", async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue("Bad request"),
    };

    fetchMock.mockResolvedValue(mockResponse);

    const client = createStorageClient(
      "https://example.supabase.co",
      "anon-key",
    );

    const mockFile = new File(["content"], "test.jpg", { type: "image/jpeg" });

    await expect(
      client.upload("avatars", "path/file.jpg", mockFile, "token"),
    ).rejects.toThrow("Upload failed: 400 - Bad request");
  });

  it("should handle 500 error", async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue("Internal server error"),
    };

    fetchMock.mockResolvedValue(mockResponse);

    const client = createStorageClient(
      "https://example.supabase.co",
      "anon-key",
    );

    const mockFile = new File(["content"], "test.jpg", { type: "image/jpeg" });

    await expect(
      client.upload("avatars", "path/file.jpg", mockFile, "token"),
    ).rejects.toThrow("Upload failed: 500 - Internal server error");
  });

  it("should correctly construct URL with different paths", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue("{}"),
    };

    fetchMock.mockResolvedValue(mockResponse);

    const client = createStorageClient("https://test.supabase.co", "test-key");

    const mockFile = new File(["content"], "image.png", {
      type: "image/png",
    });

    const result = await client.upload(
      "bucket-name",
      "folder/subfolder/image.png",
      mockFile,
      "test-token",
    );

    expect(result.url).toBe(
      "https://test.supabase.co/storage/v1/object/public/bucket-name/folder/subfolder/image.png",
    );
  });
});

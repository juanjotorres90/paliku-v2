import { describe, it, expect, vi } from "vitest";
import { getSettingsMe } from "./get-settings-me";
import type { SettingsRepositoryPort } from "../ports";

describe("getSettingsMe", () => {
  it("should return user settings", async () => {
    const mockSettings = {
      userId: "user-123",
      locale: "en",
      theme: "dark" as const,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };

    const mockSettingsRepo: SettingsRepositoryPort = {
      getById: vi.fn().mockResolvedValue(mockSettings),
      updateById: vi.fn(),
    };

    const result = await getSettingsMe(
      { accessToken: "token-123", userId: "user-123" },
      { settingsRepo: mockSettingsRepo },
    );

    expect(result).toEqual({ locale: "en", theme: "dark" });
    expect(mockSettingsRepo.getById).toHaveBeenCalledWith({
      accessToken: "token-123",
      userId: "user-123",
    });
  });

  it("should propagate errors from repository", async () => {
    const mockSettingsRepo: SettingsRepositoryPort = {
      getById: vi.fn().mockRejectedValue(new Error("Settings not found")),
      updateById: vi.fn(),
    };

    await expect(
      getSettingsMe(
        { accessToken: "token-123", userId: "user-123" },
        { settingsRepo: mockSettingsRepo },
      ),
    ).rejects.toThrow("Settings not found");
  });
});

import { describe, it, expect, vi } from "vitest";
import { updateSettingsMe } from "./update-settings-me";
import type { SettingsRepositoryPort } from "../ports";

describe("updateSettingsMe", () => {
  it("should update and return settings", async () => {
    const updatedSettings = {
      userId: "user-123",
      locale: "es",
      theme: "light" as const,
      welcomeSeen: false,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    };

    const mockSettingsRepo: SettingsRepositoryPort = {
      getById: vi.fn().mockResolvedValue(updatedSettings),
      updateById: vi.fn().mockResolvedValue(updatedSettings),
    };

    const result = await updateSettingsMe(
      {
        accessToken: "token-123",
        userId: "user-123",
        data: { locale: "es", theme: "light" },
      },
      { settingsRepo: mockSettingsRepo },
    );

    expect(result).toEqual({ locale: "es", theme: "light" });
    expect(mockSettingsRepo.updateById).toHaveBeenCalledWith({
      accessToken: "token-123",
      userId: "user-123",
      data: { locale: "es", theme: "light" },
    });
    expect(mockSettingsRepo.getById).toHaveBeenCalledTimes(1);
  });

  it("should update only locale", async () => {
    const updatedSettings = {
      userId: "user-123",
      locale: "es",
      theme: "dark" as const,
      welcomeSeen: false,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    };

    const mockSettingsRepo: SettingsRepositoryPort = {
      getById: vi.fn().mockResolvedValue(updatedSettings),
      updateById: vi.fn().mockResolvedValue(updatedSettings),
    };

    const result = await updateSettingsMe(
      {
        accessToken: "token-123",
        userId: "user-123",
        data: { locale: "es" },
      },
      { settingsRepo: mockSettingsRepo },
    );

    expect(result).toEqual({ locale: "es", theme: "dark" });
    expect(mockSettingsRepo.updateById).toHaveBeenCalledWith({
      accessToken: "token-123",
      userId: "user-123",
      data: { locale: "es" },
    });
  });

  it("should update only theme", async () => {
    const updatedSettings = {
      userId: "user-123",
      locale: "en",
      theme: "light" as const,
      welcomeSeen: false,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    };

    const mockSettingsRepo: SettingsRepositoryPort = {
      getById: vi.fn().mockResolvedValue(updatedSettings),
      updateById: vi.fn().mockResolvedValue(updatedSettings),
    };

    const result = await updateSettingsMe(
      {
        accessToken: "token-123",
        userId: "user-123",
        data: { theme: "light" },
      },
      { settingsRepo: mockSettingsRepo },
    );

    expect(result).toEqual({ locale: "en", theme: "light" });
    expect(mockSettingsRepo.updateById).toHaveBeenCalledWith({
      accessToken: "token-123",
      userId: "user-123",
      data: { theme: "light" },
    });
  });

  it("should skip update when no data provided", async () => {
    const existingSettings = {
      userId: "user-123",
      locale: "en",
      theme: "dark" as const,
      welcomeSeen: false,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };

    const mockSettingsRepo: SettingsRepositoryPort = {
      getById: vi.fn().mockResolvedValue(existingSettings),
      updateById: vi.fn(),
    };

    const result = await updateSettingsMe(
      {
        accessToken: "token-123",
        userId: "user-123",
        data: {},
      },
      { settingsRepo: mockSettingsRepo },
    );

    expect(result).toEqual({ locale: "en", theme: "dark" });
    expect(mockSettingsRepo.updateById).not.toHaveBeenCalled();
    expect(mockSettingsRepo.getById).toHaveBeenCalledTimes(1);
  });

  it("should propagate errors from repository", async () => {
    const mockSettingsRepo: SettingsRepositoryPort = {
      getById: vi.fn().mockRejectedValue(new Error("Update failed")),
      updateById: vi.fn(),
    };

    await expect(
      updateSettingsMe(
        {
          accessToken: "token-123",
          userId: "user-123",
          data: { locale: "es" },
        },
        { settingsRepo: mockSettingsRepo },
      ),
    ).rejects.toThrow("Update failed");
  });
});

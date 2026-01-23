import type { Settings, UpdateSettingsData } from "../domain/types";

export interface SettingsRepositoryPort {
  getById(input: { userId: string; accessToken: string }): Promise<Settings>;
  updateById(input: {
    userId: string;
    accessToken: string;
    data: UpdateSettingsData;
  }): Promise<Settings>;
}

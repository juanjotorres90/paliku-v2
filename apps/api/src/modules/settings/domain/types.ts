export type Theme = "system" | "light" | "dark";

export interface Settings {
  userId: string;
  theme: Theme;
  locale: string;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsMeResult {
  locale: string;
  theme: Theme;
}

export interface UpdateSettingsData {
  locale?: string;
  theme?: Theme;
}

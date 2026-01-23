import type { SettingsMeResult, UpdateSettingsData } from "../../domain/types";
import type { SettingsRepositoryPort } from "../ports";

export interface UpdateSettingsMeInput {
  accessToken: string;
  userId: string;
  data: UpdateSettingsData;
}

export interface UpdateSettingsMeContext {
  settingsRepo: SettingsRepositoryPort;
}

export async function updateSettingsMe(
  input: UpdateSettingsMeInput,
  ctx: UpdateSettingsMeContext,
): Promise<SettingsMeResult> {
  const { accessToken, userId, data } = input;
  const { settingsRepo } = ctx;

  // Update settings if anything is provided
  if (data.theme !== undefined || data.locale !== undefined) {
    await settingsRepo.updateById({
      accessToken,
      userId,
      data,
    });
  }

  // Fetch updated settings
  const settings = await settingsRepo.getById({ accessToken, userId });

  return { locale: settings.locale, theme: settings.theme };
}

import type { SettingsMeResult } from "../../domain/types";
import type { SettingsRepositoryPort } from "../ports";

export interface GetSettingsMeInput {
  accessToken: string;
  userId: string;
}

export interface GetSettingsMeContext {
  settingsRepo: SettingsRepositoryPort;
}

export async function getSettingsMe(
  input: GetSettingsMeInput,
  ctx: GetSettingsMeContext,
): Promise<SettingsMeResult> {
  const { accessToken, userId } = input;
  const { settingsRepo } = ctx;

  const settings = await settingsRepo.getById({ accessToken, userId });

  return { locale: settings.locale, theme: settings.theme };
}

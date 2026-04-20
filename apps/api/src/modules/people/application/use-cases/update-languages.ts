import type { LanguageEntry, UserLanguage } from "../../domain/types";
import type { UserLanguagesRepositoryPort } from "../ports";

export interface UpdateLanguagesInput {
  accessToken: string;
  userId: string;
  speaks: LanguageEntry[];
  learning: LanguageEntry[];
}

export interface UpdateLanguagesContext {
  languagesRepo: UserLanguagesRepositoryPort;
}

export async function updateLanguages(
  input: UpdateLanguagesInput,
  ctx: UpdateLanguagesContext,
): Promise<UserLanguage[]> {
  return ctx.languagesRepo.replaceForUser({
    accessToken: input.accessToken,
    userId: input.userId,
    speaks: input.speaks,
    learning: input.learning,
  });
}

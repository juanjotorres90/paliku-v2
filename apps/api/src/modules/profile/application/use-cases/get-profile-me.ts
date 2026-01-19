import type { ProfileMeResult } from "../../domain/types";
import type { ProfileRepositoryPort, UserEmailPort } from "../ports";

export interface GetProfileMeInput {
  accessToken: string;
  userId: string;
}

export interface GetProfileMeContext {
  profileRepo: ProfileRepositoryPort;
  userEmail: UserEmailPort;
}

export async function getProfileMe(
  input: GetProfileMeInput,
  ctx: GetProfileMeContext,
): Promise<ProfileMeResult> {
  const { accessToken, userId } = input;
  const { profileRepo, userEmail } = ctx;

  const [profile, email] = await Promise.all([
    profileRepo.getById({ accessToken, userId }),
    userEmail.getEmailForAccessToken(accessToken),
  ]);

  return { email, profile };
}

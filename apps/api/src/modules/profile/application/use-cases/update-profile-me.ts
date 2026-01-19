import type { ProfileMeResult } from "../../domain/types";
import type {
  ProfileRepositoryPort,
  UpdateProfileData,
  UserEmailPort,
} from "../ports";

export interface UpdateProfileMeInput {
  accessToken: string;
  userId: string;
  data: UpdateProfileData;
}

export interface UpdateProfileMeContext {
  profileRepo: ProfileRepositoryPort;
  userEmail: UserEmailPort;
}

export async function updateProfileMe(
  input: UpdateProfileMeInput,
  ctx: UpdateProfileMeContext,
): Promise<ProfileMeResult> {
  const { accessToken, userId, data } = input;
  const { profileRepo, userEmail } = ctx;

  const [profile, email] = await Promise.all([
    profileRepo.updateById({ accessToken, userId, data }),
    userEmail.getEmailForAccessToken(accessToken),
  ]);

  return { email, profile };
}

import type { UserEmailPort } from "../application/ports";
import type { AuthProviderPort } from "../../auth/application/ports";

export function createAuthUserEmailPort(
  authProvider: AuthProviderPort,
): UserEmailPort {
  return {
    async getEmailForAccessToken(accessToken: string) {
      const { email } = await authProvider.getUser(accessToken);
      return email;
    },
  };
}

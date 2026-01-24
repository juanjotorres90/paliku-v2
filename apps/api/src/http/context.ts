import type { Locale } from "@repo/i18n";

export interface RouteVariables {
  jwtPayload?: { sub?: string; aud?: string; role?: string };
  accessToken?: string;
  locale?: Locale;
  t?: (key: string, values?: Record<string, unknown>) => string;
}

export type RouteEnv = {
  Variables: RouteVariables;
};

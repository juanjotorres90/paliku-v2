export interface RouteVariables {
  jwtPayload?: { sub?: string; aud?: string; role?: string };
  accessToken?: string;
}

export type RouteEnv = {
  Variables: RouteVariables;
};

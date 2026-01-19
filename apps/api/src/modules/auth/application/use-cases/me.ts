import type { JWTVerifierPort } from "../ports";

export interface MeInput {
  token: string;
}

export interface MeContext {
  jwtVerifier: JWTVerifierPort;
}

export interface MeResult {
  userId: string;
  aud?: string;
  role?: string;
}

export async function me(input: MeInput, ctx: MeContext): Promise<MeResult> {
  const { token } = input;
  const { jwtVerifier } = ctx;

  const payload = await jwtVerifier.verify(token);

  if (!payload.sub) {
    throw new Error("Invalid token: missing subject");
  }

  return {
    userId: payload.sub,
    aud: payload.aud,
    role: payload.role,
  };
}

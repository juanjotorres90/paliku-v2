export type SignoutInput = Record<string, never>;

export type SignoutContext = Record<string, never>;

export interface SignoutResult {
  ok: true;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
export async function signout(
  _input: SignoutInput,
  _ctx: SignoutContext,
): Promise<SignoutResult> {
  return { ok: true };
}
/* eslint-enable @typescript-eslint/no-unused-vars */

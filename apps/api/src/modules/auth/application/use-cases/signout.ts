export interface SignoutInput {}

export interface SignoutContext {}

export interface SignoutResult {
  ok: true;
}

export async function signout(
  _input: SignoutInput,
  _ctx: SignoutContext,
): Promise<SignoutResult> {
  return { ok: true };
}

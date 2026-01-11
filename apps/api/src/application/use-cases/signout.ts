import type { SignoutResult } from "../../domain/types";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SignoutInput {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SignoutContext {}

export async function signout(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _input: SignoutInput,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _ctx: SignoutContext,
): Promise<SignoutResult> {
  return { ok: true };
}

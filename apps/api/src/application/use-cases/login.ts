import type { SupabaseAuthPort } from "../ports";
import type { LoginResult } from "../../domain/types";

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginContext {
  supabaseAuth: SupabaseAuthPort;
}

export async function login(
  input: LoginInput,
  ctx: LoginContext,
): Promise<LoginResult> {
  const { email, password } = input;
  const { supabaseAuth } = ctx;

  const tokens = await supabaseAuth.login(email, password);

  return { ok: true, tokens };
}

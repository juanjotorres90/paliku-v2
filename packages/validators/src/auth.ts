import { z } from "zod";

export const RegisterRequestSchema = z
  .object({
    email: z.string().trim().email("Invalid email").toLowerCase(),
    password: z
      .string()
      .min(8, "Password too short")
      .max(72, "Password too long"),
    displayName: z
      .string()
      .trim()
      .min(2, "Display name too short")
      .max(50, "Display name too long"),
    redirectTo: z.string().optional(),
  })
  .strict();

export const LoginRequestSchema = z
  .object({
    email: z.string().trim().email("Invalid email").toLowerCase(),
    password: z
      .string()
      .min(8, "Password too short")
      .max(72, "Password too long"),
  })
  .strict();

export type RegisterRequestInput = z.input<typeof RegisterRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export type LoginRequestInput = z.input<typeof LoginRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

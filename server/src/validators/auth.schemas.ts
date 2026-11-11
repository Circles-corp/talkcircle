import { z } from "zod";

const MAX_PASSWORD_BYTES = 72;

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .refine(
    (value) => Buffer.byteLength(value, "utf-8") <= MAX_PASSWORD_BYTES,
    "Password is too long",
  );

const email = z.string().trim().toLowerCase().max(254).pipe(z.email());

const INVITE_CODE_PATTERN = /^[A-Z0-9]{6,32}$/;

const inviteCode = z
  .string()
  .trim()
  .toUpperCase()
  .refine(
    (value) => value === "" || INVITE_CODE_PATTERN.test(value),
    "Invite code looks wrong",
  )
  .transform((value) => (value === "" ? undefined : value))
  .optional();

export const registerSchema = z.object({
  inviteCode,
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z09_]{3,20}$/,
      "Username must be 3-20 characters: letters, numbers or _",
    ),
  email,
  password,
  displayName: z.string().trim().min(1).max(50),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(1000),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

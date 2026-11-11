import type { RegistrationMode } from "../config/env.js";
import {
  claimInviteCode,
  releaseInviteCode,
} from "../repositories/inviteCode.repository.js";
import {
  createUser,
  duplicateUserField,
  findCredentialsByEmail,
  findUserById,
} from "../repositories/user.repository.js";
import type { PublicUser } from "../types/user.js";
import { AppError } from "../utils/AppError.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import type { RegisterInput } from "../validators/auth.schemas.js";

async function claimFormode(
  code: string | undefined,
  mode: RegistrationMode,
  now: Date,
): Promise<string | null> {
  if (code === undefined) {
    if (mode === "invite") {
      throw new AppError(
        400,
        "INVITE_REQUIRED",
        "An invite code is needed to join right now.",
      );
    }
    return null;
  }

  const claimed = await claimInviteCode(code, now);
  if (claimed) {
    return code;
  }
  if (mode === "invite") {
    throw new AppError(
      400,
      "INVALID_INVITE",
      "That invite code is invalid, expired or already used.",
    );
  }
  return null;
}

async function releaseQuietly(code: string): Promise<void> {
  try {
    await releaseInviteCode(code);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Could not release invite code: ${message}`);
  }
}

export async function registerUser(
  input: RegisterInput,
  mode: RegistrationMode,
  now: Date,
): Promise<PublicUser> {
  const claimedcode = await claimFormode(input.inviteCode, mode, now);

  try {
    const passwordHash = await hashPassword(input.password);
    return await createUser({
      username: input.username,
      email: input.email,
      passwordHash,
      displayName: input.displayName,
    });
  } catch (error) {
    if (claimedcode !== null) {
      await releaseQuietly(claimedcode);
    }
    const field = duplicateUserField(error);
    if (field === "email") {
      throw new AppError(
        409,
        "EMAIL_TAKEN",
        "An account with that email already exists.",
      );
    }
    if (field === "username") {
      throw new AppError(409, "USERNAME_TAKEN", "That username is taken.");
    }
    throw error;
  }
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<PublicUser | null> {
  const credentials = await findCredentialsByEmail(email);
  const passwordHash = credentials === null ? null : credentials.passwordHash;
  const isValid = await verifyPassword(password, passwordHash);
  if (!isValid || credentials === null) {
    return null;
  }
  return credentials.user;
}

export function getUserById(id: string): Promise<PublicUser | null> {
  return findUserById(id);
}

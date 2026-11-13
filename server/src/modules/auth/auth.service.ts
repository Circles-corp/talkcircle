import type { RegistrationMode } from "../../shared/config/env.js";
import { AppError } from "../../shared/utils/AppError.js";
import { claimInvite, releaseInvite } from "../invites/index.js";
import {
  createUser,
  getCredentialsByEmail,
  getUserById,
  type PublicUser,
} from "../users/index.js";
import type { RegisterInput } from "./auth.schemas.js";
import { hashPassword, verifyPassword } from "./password.js";

async function claimForMode(
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

  const claimed = await claimInvite(code, now);
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

export async function registerUser(
  input: RegisterInput,
  mode: RegistrationMode,
  now: Date,
): Promise<PublicUser> {
  const claimedCode = await claimForMode(input.inviteCode, mode, now);

  try {
    const passwordHash = await hashPassword(input.password);
    return await createUser({
      username: input.username,
      email: input.email,
      passwordHash,
      displayName: input.displayName,
    });
  } catch (error) {
    if (claimedCode !== null) {
      await releaseInvite(claimedCode);
    }
    throw error;
  }
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<PublicUser | null> {
  const credentials = await getCredentialsByEmail(email);
  const passwordHash = credentials === null ? null : credentials.passwordHash;
  const isValid = await verifyPassword(password, passwordHash);
  if (!isValid || credentials === null) {
    return null;
  }
  return credentials.user;
}

export function getSessionUser(id: string): Promise<PublicUser | null> {
  return getUserById(id);
}

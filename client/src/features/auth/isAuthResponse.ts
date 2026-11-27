import { isRecord } from "../../lib/isRecord.ts";
import type { AuthResponse, PublicUser } from "../../types/auth.ts";

const STRING_KEYS = [
  "id",
  "username",
  "email",
  "displayName",
  "bio",
  "createdAt",
] as const satisfies readonly (keyof PublicUser)[];

const NUMBER_KEYS = [
  "followerCount",
  "followingCount",
] as const satisfies readonly (keyof PublicUser)[];

export function isPublicUser(value: unknown): value is PublicUser {
  if (!isRecord(value)) {
    return false;
  }
  for (const key of STRING_KEYS) {
    if (typeof value[key] !== "string") {
      return false;
    }
  }
  for (const key of NUMBER_KEYS) {
    if (typeof value[key] !== "number") {
      return false;
    }
  }
  return true;
}

export function isAuthResponse(value: unknown): value is AuthResponse {
  return isRecord(value) && isPublicUser(value.user);
}

import {
  claimInviteCode,
  createInviteCode,
  releaseInviteCode,
} from "./inviteCode.repository.js";
import { generateInviteCode } from "./inviteCode.js";

const MAX_CREATE_ATTEMPTS = 5;

export interface InviteSettings {
  maxUses: number;
  expiresAt: Date | null;
}

function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

export function claimInvite(code: string, now: Date): Promise<boolean> {
  return claimInviteCode(code, now);
}

export async function releaseInvite(code: string): Promise<void> {
  try {
    await releaseInviteCode(code);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Could not release invite code: ${message}`);
  }
}

export async function createInvite(settings: InviteSettings): Promise<string> {
  for (let attempt = 1; attempt <= MAX_CREATE_ATTEMPTS; attempt += 1) {
    const code = generateInviteCode();
    try {
      await createInviteCode({
        code,
        maxUses: settings.maxUses,
        expiresAt: settings.expiresAt,
      });
      return code;
    } catch (error) {
      if (!isDuplicateKey(error)) {
        throw error;
      }
    }
  }
  throw new Error("Could not create a unique invite code. Try again.");
}

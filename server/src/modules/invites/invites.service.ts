import {
  claimInviteCode,
  createInviteCode,
  releaseInviteCode,
  type NewInviteCode,
} from "./inviteCode.repository.js";

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

export function createInvite(input: NewInviteCode): Promise<void> {
  return createInviteCode(input);
}

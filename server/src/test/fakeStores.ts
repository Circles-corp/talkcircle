import { randomUUID } from "node:crypto";
import type {
  NewUser,
  PublicUser,
  UserCredentials,
} from "../modules/users/index.js";

interface StoredUser {
  user: PublicUser;
  passwordHash: string;
}

interface StoredInvite {
  maxUses: number;
  useCount: number;
  expiresAt: Date | null;
}

const users = new Map<string, StoredUser>();
const invites = new Map<string, StoredInvite>();

export function resetFakeStores(): void {
  users.clear();
  invites.clear();
}

export function seedInvite(
  code: string,
  maxUses: number,
  expiresAt: Date | null,
): void {
  invites.set(code, { maxUses, useCount: 0, expiresAt });
}

export function inviteUseCount(code: string): number {
  const invite = invites.get(code);
  return invite === undefined ? -1 : invite.useCount;
}

export function deleteUserByEmail(email: string): void {
  for (const [id, stored] of users) {
    if (stored.user.email === email) {
      users.delete(id);
    }
  }
}

export function findUserById(id: string): Promise<PublicUser | null> {
  const stored = users.get(id);
  return Promise.resolve(stored === undefined ? null : stored.user);
}

export function findCredentialsByEmail(
  email: string,
): Promise<UserCredentials | null> {
  for (const stored of users.values()) {
    if (stored.user.email === email) {
      return Promise.resolve({
        user: stored.user,
        passwordHash: stored.passwordHash,
      });
    }
  }
  return Promise.resolve(null);
}

export function insertUser(input: NewUser): Promise<PublicUser> {
  for (const stored of users.values()) {
    if (stored.user.email === input.email) {
      return Promise.reject(
        Object.assign(new Error("duplicate"), {
          code: 11000,
          keyPattern: { email: 1 },
        }),
      );
    }
    if (stored.user.username === input.username) {
      return Promise.reject(
        Object.assign(new Error("duplicate"), {
          code: 11000,
          keyPattern: { username: 1 },
        }),
      );
    }
  }
  const id = randomUUID().replaceAll("-", "").slice(0, 24);
  const user: PublicUser = {
    id,
    username: input.username,
    email: input.email,
    displayName: input.displayName,
    bio: "",
    followerCount: 0,
    followingCount: 0,
    createdAt: new Date().toISOString(),
  };
  users.set(id, { user, passwordHash: input.passwordHash });
  return Promise.resolve(user);
}

export function claimInviteCode(code: string, now: Date): Promise<boolean> {
  const invite = invites.get(code);
  if (invite === undefined) {
    return Promise.resolve(false);
  }
  if (invite.useCount >= invite.maxUses) {
    return Promise.resolve(false);
  }
  if (invite?.expiresAt !== null && invite.expiresAt <= now) {
    return Promise.resolve(false);
  }
  invite.useCount += 1;
  return Promise.resolve(true);
}

export function releaseInviteCode(code: string): Promise<void> {
  const invite = invites.get(code);
  if (invite !== undefined && invite.useCount > 0) {
    invite.useCount -= 1;
  }
  return Promise.resolve();
}

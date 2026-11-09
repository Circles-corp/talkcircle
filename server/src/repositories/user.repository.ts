import { Types } from "mongoose";
import { UserModel, type UserRecord } from "../models/user.model.js";
import type {
  DuplicateUserField,
  NewUser,
  PublicUser,
  UserCredentials,
} from "../types/user.js";

type LeanUser = UserRecord & { _id: Types.ObjectId };

function toPublicUser(user: LeanUser): PublicUser {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    bio: user.bio,
    followerCount: user.followerCount,
    followingCount: user.followingCount,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function findUserById(id: string): Promise<PublicUser | null> {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }
  const user = await UserModel.findById(id).lean<LeanUser>().exec();
  return user === null ? null : toPublicUser(user);
}

export async function findCredentialsByEmail(
  email: string,
): Promise<UserCredentials | null> {
  const user = await UserModel.findOne({ email })
    .select("+passwordHash")
    .lean<LeanUser>()
    .exec();
  if (user === null) {
    return null;
  }
  return { user: toPublicUser(user), passwordHash: user.passwordHash };
}

export async function createUser(input: NewUser): Promise<PublicUser> {
  const created = await UserModel.create(input);
  return toPublicUser(created.toObject<LeanUser>());
}

export function duplicateUserField(error: unknown): DuplicateUserField | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }
  if (!("code" in error) || error.code !== 11000) {
    return null;
  }
  if (!("keyPattern" in error)) {
    return null;
  }
  const pattern = error.keyPattern;
  if (typeof pattern !== "object" || pattern === null) {
    return null;
  }
  if ("email" in pattern) {
    return "email";
  }
  if ("username" in pattern) {
    return "username";
  }
  return null;
}
import { AppError } from "../../shared/utils/AppError.js";
import {
  duplicateUserField,
  findCredentialsByEmail,
  findUserById,
  insertUser,
} from "./user.repository.js";
import type { NewUser, PublicUser, UserCredentials } from "./user.types.js";

export function getUserById(id: string): Promise<PublicUser | null> {
  return findUserById(id);
}

export function getCredentialsByEmail(
  email: string,
): Promise<UserCredentials | null> {
  return findCredentialsByEmail(email);
}

export async function createUser(input: NewUser): Promise<PublicUser> {
  try {
    return await insertUser(input);
  } catch (error) {
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

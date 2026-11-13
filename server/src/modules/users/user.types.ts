export interface PublicUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio: string;
  followerCount: number;
  followingCount: number;
  createdAt: string;
}

export interface NewUser {
  username: string;
  email: string;
  passwordHash: string;
  displayName: string;
}

export interface UserCredentials {
  user: PublicUser;
  passwordHash: string;
}

export type DuplicateUserField = "email" | "username";

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

export interface AuthResponse {
  user: PublicUser;
}

export interface SessionResponse {
  user: PublicUser | null;
}

export type RegistrationMode = "invite" | "open";

export interface RegistrationInfo {
  mode: RegistrationMode;
}

export interface RegisterRequest {
  inviteCode?: string;
  username: string;
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

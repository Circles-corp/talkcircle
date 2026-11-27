import { delay, http, HttpResponse } from "msw";
import { isPublicUser } from "../features/auth/isAuthResponse.ts";
import { isRecord } from "../lib/isRecord.ts";
import type { PublicUser } from "../types/auth.ts";

const API = "/api/v1";
const SESSION_STORAGE_KEY = "pinned-mock-session";
const RATE_WINDOWS_MS = 60_000;
const RATE_LIMIT = 10;
const INVITE_PATTERN = /^[A-Z0-9]{6,32}$/;
const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface MockAccount {
  user: PublicUser;
  password: string;
}

const accounts: MockAccount[] = [
  {
    user: {
      id: "user-demo",
      username: "demo",
      email: "demo@pinned.test",
      displayName: "Demo Fan",
      bio: "",
      followerCount: 12,
      followingCount: 30,
      createdAt: "2026-11-01T09:00:00.000Z",
    },
    password: "pinnedbeta",
  },
  {
    user: {
      id: "user-johnnymax",
      username: "johnnymax",
      email: "johnny@pinned.test",
      displayName: "Johnnymax",
      bio: "",
      followerCount: 140,
      followingCount: 52,
      createdAt: "2026-10-01T09:00:00.000Z",
    },
    password: "not-a-real-password",
  },
];

const inviteUsesLeft = new Map<string, number>([
  ["PINNED26", 100],
  ["BETA001", 1],
  ["USEDUP26", 0],
]);

const attemptsTimes: number[] = [];

function errorResponse(
  status: number,
  code: string,
  message: string,
): Response {
  return HttpResponse.json({ error: { code, message } }, { status });
}

function readSessionUser(): PublicUser | null {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored === null) {
      return null;
    }
    const parsed: unknown = JSON.parse(stored);
    return isPublicUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeSessionUser(user: PublicUser | null): void {
  try {
    if (user === null) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  } catch {
    return;
  }
}

function isRateLimited(now: number): boolean {
  while (
    attemptsTimes.length > 0 &&
    now - (attemptsTimes[0] ?? now) > RATE_WINDOWS_MS
  ) {
    attemptsTimes.shift();
  }
  attemptsTimes.push(now);
  return attemptsTimes.length > RATE_LIMIT;
}

async function readBody(
  request: Request,
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return isRecord(body) ? body : null;
  } catch {
    return null;
  }
}

function readText(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  return typeof value === "string" ? value : "";
}

function findByEmail(email: string): MockAccount | undefined {
  return accounts.find((account) => account.user.email === email);
}

async function register(request: Request): Promise<Response> {
  await delay(700);
  if (isRateLimited(Date.now())) {
    return errorResponse(
      429,
      "RATE_LIMITED",
      "Too many requests. Please wait a moment and try again.",
    );
  }
  const body = await readBody(request);
  if (body === null) {
    return errorResponse(400, "INVALID_JSON", "Request body is not valid JSON");
  }
  const inviteCode = readText(body, "inviteCode").trim().toUpperCase();
  const username = readText(body, "username").trim().toLowerCase();
  const email = readText(body, "email").trim().toLowerCase();
  const password = readText(body, "password");
  const displayName = readText(body, "displayName").trim();

  if (
    !USERNAME_PATTERN.test(username) ||
    !EMAIL_PATTERN.test(email) ||
    password.length < 8 ||
    displayName.length === 0 ||
    displayName.length > 50
  ) {
    return errorResponse(400, "VALIDATION_ERROR", "Invalid request data");
  }
  if (inviteCode === "") {
    return errorResponse(
      400,
      "INVITE_REQUIRED",
      "An invite code is needed to join right now.",
    );
  }
  const usesLeft = inviteUsesLeft.get(inviteCode) ?? 0;
  if (!INVITE_PATTERN.test(inviteCode) || usesLeft < 1) {
    return errorResponse(
      400,
      "INVALID_INVITE",
      "That invite code is invalid, expired or already used.",
    );
  }
  if (findByEmail(email) !== undefined) {
    return errorResponse(
      409,
      "EMAIL_TAKEN",
      "An account with that email already exists.",
    );
  }
  if (accounts.some((account) => account.user.username === username)) {
    return errorResponse(409, "USERNAME_TAKEN", "That username is taken.");
  }

  inviteUsesLeft.set(inviteCode, usesLeft - 1);
  const user: PublicUser = {
    id: `user-${crypto.randomUUID()}`,
    username,
    email,
    displayName,
    bio: "",
    followerCount: 0,
    followingCount: 0,
    createdAt: new Date().toISOString(),
  };
  accounts.push({ user, password });
  writeSessionUser(user);
  return HttpResponse.json({ user }, { status: 201 });
}

async function login(request: Request): Promise<Response> {
  await delay(600);
  if (isRateLimited(Date.now())) {
    return errorResponse(
      429,
      "RATE_LIMITED",
      "Too many requests. Please wait a moment and try again.",
    );
  }
  const body = await readBody(request);
  if (body === null) {
    return errorResponse(400, "INVALID_JSON", "Request body is not valid JSON");
  }
  const email = readText(body, "email").trim().toLowerCase();
  const password = readText(body, "password");
  const account = findByEmail(email);
  if (account === undefined || account.password !== password) {
    return errorResponse(
      401,
      "INVALID_CREDENTIALS",
      "Email or password is incorrect.",
    );
  }
  writeSessionUser(account.user);
  return HttpResponse.json({ user: account.user });
}

export const authHandlers = [
  http.get(`${API}/auth/registration`, async () => {
    await delay(200);
    return HttpResponse.json({ mode: "invite" });
  }),
  http.get(`${API}/auth/me`, async () => {
    await delay(300);
    const user = readSessionUser();
    if (user === null) {
      return errorResponse(401, "UNAUTHORIZED", "Authentication required");
    }
    return HttpResponse.json({ user });
  }),
  http.post(`${API}/auth/register`, ({ request }) => register(request)),
  http.post(`${API}/auth/login`, ({ request }) => login(request)),
  http.post(`${API}/auth/logout`, async () => {
    await delay(200);
    writeSessionUser(null);
    return new HttpResponse(null, { status: 204 });
  }),
];

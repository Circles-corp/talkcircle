import type { CookieOptions } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../shared/config/env.js";

export const SESSION_COOKIE_NAME = "circle_session";

const SESSION_DAYS = 7;
const SESSION_SECONDS = SESSION_DAYS * 24 * 60 * 60;

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

export const sessionCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  maxAge: SESSION_SECONDS * 1000,
};

export const clearSessionCookieOptions: CookieOptions = baseCookieOptions;

export function signSessionToken(userId: string): string {
  return jwt.sign({}, env.JWT_SECRET, {
    subject: userId,
    expiresIn: SESSION_SECONDS,
    algorithm: "HS256",
  });
}

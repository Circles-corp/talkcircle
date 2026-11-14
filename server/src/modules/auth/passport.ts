import type { Request } from "express";
import passport from "passport";
import {
  ExtractJwt,
  Strategy as JwtStrategy,
  type VerifiedCallback,
} from "passport-jwt";
import { Strategy as LocalStrategy } from "passport-local";
import { env } from "../../shared/config/env.js";
import { getSessionUser, verifyCredentials } from "./auth.service.js";
import { SESSION_COOKIE_NAME } from "./sessionToken.js";

function tokenFromCookie(req: Request): string | null {
  const value: unknown = req.cookies[SESSION_COOKIE_NAME];
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }
  return value;
}

function subjectOf(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }
  if (!("sub" in payload) || typeof payload.sub !== "string") {
    return null;
  }
  return payload.sub;
}

passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password", session: false },
    (email, password, done) => {
      verifyCredentials(email, password).then(
        (user) => {
          done(null, user ?? false);
        },
        (error: unknown) => {
          done(error);
        },
      );
    },
  ),
);

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromExtractors([
        tokenFromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: env.JWT_SECRET,
      algorithms: ["HS256"],
    },
    (payload: unknown, done: VerifiedCallback) => {
      const userId = subjectOf(payload);
      if (userId === null) {
        done(null, false);
        return;
      }
      getSessionUser(userId).then(
        (user) => {
          done(null, user ?? false);
        },
        (error: unknown) => {
          done(error, false);
        },
      );
    },
  ),
);

export { passport };

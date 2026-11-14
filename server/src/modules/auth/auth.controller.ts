import type { RequestHandler, Response } from "express";
import { env } from "../../shared/config/env.js";
import { AppError } from "../../shared/utils/AppError.js";
import type { PublicUser } from "../users/index.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import { registerUser } from "./auth.service.js";
import { passport } from "./passport.js";
import {
  clearSessionCookieOptions,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
  signSessionToken,
} from "./sessionToken.js";

function startSession(res: Response, user: PublicUser): void {
  res.cookie(
    SESSION_COOKIE_NAME,
    signSessionToken(user.id),
    sessionCookieOptions,
  );
}

export const register: RequestHandler = async (req, res) => {
  const input = registerSchema.parse(req.body);
  const user = await registerUser(input, env.REGISTRATION_MODE, new Date());
  startSession(res, user);
  res.status(201).json({ user });
};

export const login: RequestHandler = (req, res, next) => {
  const input = loginSchema.parse(req.body);
  req.body = input;
  const authenticate = passport.authenticate(
    "local",
    { session: false },
    (error: unknown, user: PublicUser | false) => {
      if (error !== null && error !== undefined) {
        next(error);
        return;
      }
      if (user === false) {
        next(
          new AppError(
            401,
            "INAVLID_CREDENTIALS",
            "Email or password is incorrect.",
          ),
        );
        return;
      }
      startSession(res, user);
      res.status(200).json({ user });
    },
  ) as RequestHandler;
  authenticate(req, res, next);
};

export const registrationInfo: RequestHandler = (_req, res) => {
  res.status(200).json({ mode: env.REGISTRATION_MODE });
};

export const logout: RequestHandler = (_req, res) => {
  res.clearCookie(SESSION_COOKIE_NAME, clearSessionCookieOptions);
  res.status(204).end();
};

export const me: RequestHandler = (_req, res, next) => {
  const user = res.locals.authUser;
  if (user === undefined) {
    next(AppError.unauthorized());
    return;
  }
  res.status(200).json({ user });
};

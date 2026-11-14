import type { RequestHandler } from "express";
import { AppError } from "../../shared/utils/AppError.js";
import type { PublicUser } from "../users/index.js";
import { passport } from "./passport.js";

export const requireAuth: RequestHandler = (req, res, next) => {
  const authenticate = passport.authenticate(
    "jwt",
    { session: false },
    (error: unknown, user: PublicUser | false) => {
      if (error !== null && error !== undefined) {
        next(error);
        return;
      }
      if (user === false) {
        next(AppError.unauthorized());
        return;
      }
      res.locals.authUser = user;
      next();
    },
  ) as RequestHandler;
  authenticate(req, res, next);
};

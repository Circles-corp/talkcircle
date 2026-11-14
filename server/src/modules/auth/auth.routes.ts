import { Router } from "express";
import {
  login,
  logout,
  me,
  register,
  registrationInfo,
} from "./auth.controller.js";
import { requireAuth } from "./requireAuth.js";

export const authRouter: Router = Router();

authRouter.get("/registration", registrationInfo);
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);

import { Router } from "express";
import { authRouter } from "../modules/auth/index.js";

export const v1Router: Router = Router();

v1Router.get("/", (_req, res) => {
  res.status(200).json({ version: "v1" });
});

v1Router.use("/auth", authRouter);

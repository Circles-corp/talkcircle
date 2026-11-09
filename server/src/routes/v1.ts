import { Router } from "express";

export const v1Router: Router = Router();

v1Router.get("/", (_req, res) => {
  res.status(200).json({ version: "v1" });
});

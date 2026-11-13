import cors from "cors";
import express, { type Express, type RequestHandler } from "express";
import helmet from "helmet";
import { isDBConnected } from "./shared/config/db.js";
import { env } from "./shared/config/env.js";
import { errorHandler, notFound } from "./shared/middleware/errorHandler.js";
import { apiLimiter, authLimiter } from "./shared/middleware/rateLimit.js";
import { createRequestLogger } from "./shared/middleware/requestLogger.js";
import { v1Router } from "./routes/v1.js";

const noStore: RequestHandler = (_req, res, next) => {
  res.set("Cache-control", "no-store");
  next();
};

const healthCheck: RequestHandler = (_req, res) => {
  const uptimeSeconds = Math.round(process.uptime());

  if (isDBConnected()) {
    res
      .status(200)
      .json({ status: "ok", db: "connected", uptime: uptimeSeconds });
    return;
  }

  res
    .status(503)
    .json({ status: "degraded", db: "disconnected", uptime: uptimeSeconds });
};

export const app: Express = express();

if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(
  createRequestLogger({
    enabled: env.NODE_ENV !== "test",
    skipPaths: ["/api/health"],
  }),
);
app.use(helmet());
app.use(cors({ origin: env.CLIENT_ORIGIN }));
app.use(express.json({ limit: "1mb" }));
app.use("/api", noStore);

app.get("/api/health", healthCheck);

app.get("/", (_req, res) => {
  res.status(200).json({
    name: "Circle API",
    status: "running",
    health: "/api/health",
    api: "/api/v1",
  });
});

app.use("/api", apiLimiter);
app.use("/api/v1/auth", authLimiter);
app.use("/api/v1", v1Router);

app.use(notFound);
app.use(errorHandler);

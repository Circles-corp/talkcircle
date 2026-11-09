import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

const REQUEST_ID_HEADER = "X-Request-Id";
const MAX_INCOMING_ID_LENGTH = 64;
const SAFE_ID_PATTERN = /^[A-Za-z0-9-]+$/;

interface RequestLoggerOptions {
  enabled: boolean;
  skipPaths: readonly string[];
}

function chooseRequestId(incoming: string | undefined): string {
  if (
    incoming !== undefined &&
    incoming.length > 0 &&
    incoming.length <= MAX_INCOMING_ID_LENGTH &&
    SAFE_ID_PATTERN.test(incoming)
  ) {
    return incoming;
  }
  return randomUUID();
}

export function createRequestLogger(
  options: RequestLoggerOptions,
): RequestHandler {
  return (req, res, next) => {
    const requestId = chooseRequestId(req.get(REQUEST_ID_HEADER));
    const method = req.method;
    const path = req.path;
    res.set(REQUEST_ID_HEADER, requestId);

    if (!options.enabled || options.skipPaths.includes(path)) {
      next();
      return;
    }

    const startedAt = process.hrtime.bigint();
    res.on("finish", () => {
      const elapsedNs = process.hrtime.bigint() - startedAt;
      const durationMs = (Number(elapsedNs) / 1_000_000).toFixed(1);
      console.info(
        `${requestId} ${method} ${path} ${String(res.statusCode)} ${durationMs}ms`,
      );
    });
    next();
  };
}

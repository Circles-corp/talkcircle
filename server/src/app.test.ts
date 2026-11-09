import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "./app.js";
import { env } from "./config/env.js";

describe("app", () => {
  it("reports 503 on /api/health when the database is not connected", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      status: "degraded",
      db: "disconnected",
    });
  });

  it("marks API responses as not cacheable", async () => {
    const response = await request(app).get("/api/health");
    expect(response.get("Cache-Control")).toBe("no-store");
  });

  it("returns the standard 404 shape for unknown API routes", async () => {
    const response = await request(app).get("/api/does-not-exist");
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Route GET /api/does-not-exist not found",
      },
    });
  });

  it("announces only the configured client origin", async () => {
    const allowed = await request(app)
      .get("/api/health")
      .set("Origin", env.CLIENT_ORIGIN);
    expect(allowed.get("Access-Control-Allow-Origin")).toBe(env.CLIENT_ORIGIN);

    const other = await request(app)
      .get("/api/health")
      .set("Origin", "https://evil.example");
    expect(other.get("Access-Control-Allow-Origin")).not.toBe(
      "https://evil.example",
    );
  });

  it("sets security headers and hides the framework", async () => {
    const response = await request(app).get("/api/health");
    expect(response.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.get("X-Powered-By")).toBeUndefined();
  });

  it("describes the API at the root URL", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      name: "Circle API",
      status: "running",
      health: "/api/health",
      api: "/api/v1",
    });
  });

  it("serves version 1 of the API under /api/v1", async () => {
    const response = await request(app).get("/api/v1");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ version: "v1" });
  });

  it("returns the standard 404 shape for unknown v1 routes", async () => {
    const response = await request(app).get("/api/v1/does-not-exist");
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Route GET /api/v1/does-not-exist not found",
      },
    });
  });

  it("gives every response a request id", async () => {
    const response = await request(app).get("/api/v1");
    expect(response.get("X-Request-Id")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("keeps a safe incoming request id and replaces an unsafe one", async () => {
    const safe = await request(app)
      .get("/api/v1")
      .set("X-Request-Id", "client-abc-123");
    expect(safe.get("X-Request-Id")).toBe("client-abc-123");

    const unsafe = await request(app)
      .get("/api/v1")
      .set("X-Request-Id", "<script>alert(1)</script>");
    expect(unsafe.get("X-Request-Id")).not.toBe("<script>alert(1)</script>");
  });

  it("rate limits /api/v1/auth after 10 requests a minute", async () => {
    for (let attempt = 1; attempt <= 10; attempt += 1) {
      const response = await request(app).post("/api/v1/auth/login");
      expect(response.status).toBe(404);
    }
    const blocked = await request(app).post("/api/v1/auth/login");
    expect(blocked.status).toBe(429);
    expect(blocked.body).toMatchObject({ error: { code: "RATE_LIMITED" } });
  });
});

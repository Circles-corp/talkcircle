import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteUserByEmail,
  inviteUseCount,
  resetFakeStores,
  seedInvite,
} from "../../test/fakeStores.js";

vi.mock("../../shared/config/env.js", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("../../shared/config/env.js")>();
  return {
    env: Object.freeze({ ...original.env, REGISTRATION_MODE: "invite" }),
  };
});

vi.mock("../users/user.repository.js", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("../users/user.repository.js")>();
  const fakes = await import("../../test/fakeStores.js");
  return {
    ...original,
    findUserById: fakes.findUserById,
    findCredentialsByEmail: fakes.findCredentialsByEmail,
    insertUser: fakes.insertUser,
  };
});

vi.mock("../invites/inviteCode.repository.js", async () => {
  const fakes = await import("../../test/fakeStores.js");
  return {
    claimInviteCode: fakes.claimInviteCode,
    releaseInviteCode: fakes.releaseInviteCode,
    createInviteCode: () => Promise.resolve(),
  };
});

vi.mock("../../shared/middleware/rateLimit.js", () => {
  const passThrough: RequestHandler = (_req, _res, next) => {
    next();
  };
  return { apiLimiter: passThrough, authLimiter: passThrough };
});

const { app } = await import("../../app.js");
const { env } = await import("../../shared/config/env.js");

const VALID = {
  inviteCode: "PINNED01",
  username: "johnnymax",
  email: "john@example.com",
  password: "correct-horse-battery",
  displayName: "John Achadu",
};

function sessionCookie(setCookie: string[] | undefined): string {
  const cookie = (setCookie ?? []).find((value) =>
    value.startsWith("pinned_session="),
  );
  if (cookie === undefined) {
    throw new Error("No session cookie was set");
  }
  return cookie;
}

function cookiePair(setCookie: string[] | undefined): string {
  return sessionCookie(setCookie).split(";")[0] ?? "";
}

beforeEach(() => {
  resetFakeStores();
  seedInvite("PINNED01", 5, null);
});

describe("POST /api/v1/auth/register", () => {
  it("creates the user, returns no password data and sets a secure session cookie", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(VALID);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      user: {
        username: "johnnymax",
        email: "john@example.com",
        followerCount: 0,
      },
    });
    expect(JSON.stringify(response.body)).not.toContain("password");
    const cookie = sessionCookie(response.get("Set-Cookie"));
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
  });

  it("normalises case and spacing before saving", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        ...VALID,
        username: "JohnnyMax",
        email: " John@Example.COM ",
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      user: { username: "johnnymax", email: "john@example.com" },
    });
  });

    it("accepts usernames that contain any digit", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...VALID, username: "tunde_2024" });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ user: { username: "tunde_2024" } });
  });

  it("counts one use of the invite code", async () => {
    await request(app).post("/api/v1/auth/register").send(VALID);

    expect(inviteUseCount("PINNED01")).toBe(1);
  });

  it("accepts the invite code in lowercase with spaces", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...VALID, inviteCode: " pinned01 " });

    expect(response.status).toBe(201);
  });

  it("requires an invite code in invite mode", async () => {
    const withoutCode = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...VALID, inviteCode: undefined });
    const blankCode = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...VALID, inviteCode: "   " });

    expect(withoutCode.status).toBe(400);
    expect(withoutCode.body).toMatchObject({
      error: { code: "INVITE_REQUIRED" },
    });
    expect(blankCode.body).toMatchObject({
      error: { code: "INVITE_REQUIRED" },
    });
  });

  it("rejects an unknown invite code", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...VALID, inviteCode: "NOPE1234" });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ error: { code: "INVALID_INVITE" } });
  });

  it("rejects an expired invite code", async () => {
    seedInvite("OLDCODE1", 5, new Date(Date.now() - 1000));
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...VALID, inviteCode: "OLDCODE1" });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ error: { code: "INVALID_INVITE" } });
  });

  it("stops an invite code once all its uses are taken", async () => {
    seedInvite("SINGLE01", 1, null);
    const first = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...VALID, inviteCode: "SINGLE01" });
    const second = await request(app)
      .post("/api/v1/auth/register")
      .send({
        ...VALID,
        inviteCode: "SINGLE01",
        username: "second",
        email: "second@example.com",
      });

    expect(first.status).toBe(201);
    expect(second.status).toBe(400);
    expect(second.body).toMatchObject({ error: { code: "INVALID_INVITE" } });
  });

  it("ignores fields the client is not allowed to set", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...VALID, followerCount: 999999 });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ user: { followerCount: 0 } });
  });

  it("returns 409 for a taken email and gives the invite use back", async () => {
    await request(app).post("/api/v1/auth/register").send(VALID);
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...VALID, username: "someoneelse" });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ error: { code: "EMAIL_TAKEN" } });
    expect(inviteUseCount("PINNED01")).toBe(1);
  });

  it("returns 409 for a taken username", async () => {
    await request(app).post("/api/v1/auth/register").send(VALID);
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...VALID, email: "other@example.com" });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ error: { code: "USERNAME_TAKEN" } });
  });

  it("validates username, email and password", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({
        ...VALID,
        username: "a b",
        email: "not-an-email",
        password: "short",
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("rejects passwords longer than 72 bytes, even when they look short", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...VALID, password: "🔥".repeat(19) });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: { code: "VALIDATION_ERROR" },
    });
  });
});

describe("GET /api/v1/auth/registration", () => {
  it("tells the client which registration mode is on", async () => {
    const response = await request(app).get("/api/v1/auth/registration");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ mode: "invite" });
  });
});

describe("POST /api/v1/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/v1/auth/register").send(VALID);
  });

  it("logs in with the right password and sets the session cookie", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "JOHN@example.com", password: VALID.password });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ user: { username: "johnnymax" } });
    expect(sessionCookie(response.get("Set-Cookie"))).toContain("HttpOnly");
  });

  it("gives the same answer for a wrong password and an unknown email", async () => {
    const wrongPassword = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: VALID.email, password: "wrong-password" });
    const unknownEmail = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "nobody@example.com", password: "wrong-password" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
    expect(wrongPassword.body).toMatchObject({
      error: { code: "INVALID_CREDENTIALS" },
    });
  });

  it("rejects a missing password with a validation error", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: VALID.email });

    expect(response.status).toBe(400);
  });
});

describe("GET /api/v1/auth/me and logout", () => {
  it("returns 401 without a session", async () => {
    const response = await request(app).get("/api/v1/auth/me");

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ error: { code: "UNAUTHORIZED" } });
  });

  it("returns the user for a valid session cookie", async () => {
    const registered = await request(app)
      .post("/api/v1/auth/register")
      .send(VALID);
    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", cookiePair(registered.get("Set-Cookie")));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ user: { username: "johnnymax" } });
  });

  it("accepts a Bearer token for future mobile clients", async () => {
    const registered = await request(app)
      .post("/api/v1/auth/register")
      .send(VALID);
    const token = cookiePair(registered.get("Set-Cookie")).replace(
      "pinned_session=",
      "",
    );
    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
  });

  it("rejects a tampered token", async () => {
    const registered = await request(app)
      .post("/api/v1/auth/register")
      .send(VALID);
    const tampered = `${cookiePair(registered.get("Set-Cookie"))}x`;
    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", tampered);

    expect(response.status).toBe(401);
  });

  it("rejects an expired token", async () => {
    const registered = await request(app)
      .post("/api/v1/auth/register")
      .send(VALID);
    const body: unknown = registered.body;
    const userId =
      typeof body === "object" &&
      body !== null &&
      "user" in body &&
      typeof body.user === "object" &&
      body.user !== null &&
      "id" in body.user &&
      typeof body.user.id === "string"
        ? body.user.id
        : "";
    const expired = jwt.sign(
      { exp: Math.floor(Date.now() / 1000) - 60 },
      env.JWT_SECRET,
      { subject: userId, algorithm: "HS256" },
    );
    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", `pinned_session=${expired}`);

    expect(response.status).toBe(401);
  });

  it("rejects a token signed with a different algorithm setting", async () => {
    const forged = jwt.sign({}, "", { algorithm: "none", subject: "someone" });
    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", `pinned_session=${forged}`);

    expect(response.status).toBe(401);
  });

  it("rejects a valid token whose user no longer exists", async () => {
    const registered = await request(app)
      .post("/api/v1/auth/register")
      .send(VALID);
    const cookie = cookiePair(registered.get("Set-Cookie"));
    deleteUserByEmail(VALID.email);
    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", cookie);

    expect(response.status).toBe(401);
  });

  it("clears the cookie on logout, even without a session", async () => {
    const response = await request(app).post("/api/v1/auth/logout");

    expect(response.status).toBe(204);
    const cleared = sessionCookie(response.get("Set-Cookie"));
    expect(cleared).toContain("Expires=Thu, 01 Jan 1970");
  });
});

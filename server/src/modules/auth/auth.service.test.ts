import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  inviteUseCount,
  resetFakeStores,
  seedInvite,
} from "../../test/fakeStores.js";

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

const { registerUser } = await import("./auth.service.js");

const BASE = {
  username: "openuser",
  email: "open@example.com",
  password: "correct-horse-battery",
  displayName: "Open User",
};

beforeEach(() => {
  resetFakeStores();
  seedInvite("OAPCODE1", 100, null);
});

describe("registerUser in open mode", () => {
  it("registers without an invite code", async () => {
    const user = await registerUser(
      { ...BASE, inviteCode: undefined },
      "open",
      new Date(),
    );
    expect(user.username).toBe("openuser");
  });

  it("still counts a valid invite code, for tracking where people came from", async () => {
    await registerUser({ ...BASE, inviteCode: "OAPCODE1" }, "open", new Date());

    expect(inviteUseCount("OAPCODE1")).toBe(1);
  });

  it("ignores an invalid invite code instead of blocking sign-up", async () => {
    const user = await registerUser(
      { ...BASE, inviteCode: "WRONG123" },
      "open",
      new Date(),
    );

    expect(user.username).toBe("openuser");
  });
});

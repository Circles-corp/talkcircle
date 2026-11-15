import { beforeEach, describe, expect, it, vi } from "vitest";

const createInviteCode = vi.fn<(input: unknown) => Promise<void>>();

vi.mock("./inviteCode.repository.js", () => ({
  claimInviteCode: () => Promise.resolve(false),
  releaseInviteCode: () => Promise.resolve(),
  createInviteCode,
}));

const { createInvite } = await import("./invites.service.js");

function duplicateKeyError(): Error {
  return Object.assign(new Error("duplicate"), { code: 11000 });
}

beforeEach(() => {
  createInviteCode.mockReset();
});

describe("createInvite", () => {
  it("saves a new code with the given settings and returns it", async () => {
    createInviteCode.mockResolvedValue(undefined);

    const code = await createInvite({ maxUses: 3, expiresAt: null });

    expect(code).toMatch(/^[A-Z2-9]{8}$/);
    expect(createInviteCode).toHaveBeenCalledWith({
      code,
      maxUses: 3,
      expiresAt: null,
    });
  });

  it("tries a fresh code when the first one already exists", async () => {
    createInviteCode
      .mockRejectedValueOnce(duplicateKeyError())
      .mockResolvedValue(undefined);

    await createInvite({ maxUses: 1, expiresAt: null });

    expect(createInviteCode).toHaveBeenCalledTimes(2);
  });

  it("gives up after 5 clashes", async () => {
    createInviteCode.mockRejectedValue(duplicateKeyError());

    await expect(createInvite({ maxUses: 1, expiresAt: null })).rejects.toThrow(
      "Could not create a unique invite code",
    );
    expect(createInviteCode).toHaveBeenCalledTimes(5);
  });

  it("passes other database errors straight through", async () => {
    createInviteCode.mockRejectedValue(new Error("connection lost"));

    await expect(createInvite({ maxUses: 1, expiresAt: null })).rejects.toThrow(
      "connection lost",
    );
    expect(createInviteCode).toHaveBeenCalledTimes(1);
  });
});

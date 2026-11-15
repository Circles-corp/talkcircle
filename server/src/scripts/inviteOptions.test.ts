import { describe, expect, it } from "vitest";
import { parseInviteOptions } from "./inviteOptions.js";

describe("parseInviteOptions", () => {
  it("defaults to one use and no expiry", () => {
    expect(parseInviteOptions([])).toEqual({ maxUses: 1, days: null });
  });

  it("reads --uses and --days", () => {
    expect(parseInviteOptions(["--uses=5", "--days=14"])).toEqual({
      maxUses: 5,
      days: 14,
    });
  });

  it("rejects values that are not whole numbers from 1 to 1000", () => {
    expect(() => parseInviteOptions(["--uses=0"])).toThrow();
    expect(() => parseInviteOptions(["--uses=2.5"])).toThrow();
    expect(() => parseInviteOptions(["--days=abc"])).toThrow();
    expect(() => parseInviteOptions(["--days=1001"])).toThrow();
  });
});

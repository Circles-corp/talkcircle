import { describe, expect, it } from "vitest";
import { generateInviteCode } from "./inviteCode.js";

describe("generateInviteCode", () => {
  it("makes 8-character codes without look-alike characters", () => {
    for (let attempt = 0; attempt < 200; attempt += 1) {
      const code = generateInviteCode();
      expect(code).toMatch(/^[A-Z2-9]{8}$/);
      expect(code).not.toMatch(/[00I1]/);
    }
  });
});

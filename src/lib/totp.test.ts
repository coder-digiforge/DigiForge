import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateTotpCode, generateTotpSecret, verifyTotpCode } from "./totp.ts";

describe("totp", () => {
  it("generates and verifies code", () => {
    const secret = generateTotpSecret();
    const code = generateTotpCode(secret);
    assert.equal(verifyTotpCode(secret, code), true);
    assert.equal(verifyTotpCode(secret, "000000"), false);
  });
});

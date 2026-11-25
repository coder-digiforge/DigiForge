import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "crypto";
import {
  isSuccessfulPaymentStatus,
  normalizeWebhookStatus,
  resolveDepositId,
  verifyWebhookSignature,
} from "./webhook.ts";

describe("webhook helpers", () => {
  it("verifies HMAC signature", () => {
    const secret = "test-secret";
    const rawBody = '{"payment_status":"finished","order_id":"dep-1"}';
    const sig = createHmac("sha512", secret).update(rawBody).digest("hex");
    assert.equal(
      verifyWebhookSignature({ rawBody, signatureHeader: sig, secret }),
      true,
    );
    assert.equal(
      verifyWebhookSignature({ rawBody, signatureHeader: "deadbeef", secret }),
      false,
    );
  });

  it("resolves deposit id and success status", () => {
    assert.equal(resolveDepositId({ order_id: "dep-9" }), "dep-9");
    assert.equal(isSuccessfulPaymentStatus(normalizeWebhookStatus({ payment_status: "finished" })), true);
    assert.equal(isSuccessfulPaymentStatus(normalizeWebhookStatus({ payment_status: "waiting" })), false);
  });
});

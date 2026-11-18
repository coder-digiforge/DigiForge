import { createHmac, timingSafeEqual } from "crypto";

export type WebhookPayload = {
  depositId?: string;
  status?: string;
  txHash?: string;
  amount?: number | string;
  eventId?: string;
  order_id?: string;
  payment_status?: string;
  payment_id?: string;
};

/**
 * Verify provider IPN / webhook signature.
 * Supports:
 * - hex HMAC-SHA512 of raw body (NOWPayments-style `x-nowpayments-sig`)
 * - hex HMAC-SHA256 of raw body (`x-signature` / `x-cryptopay-signature`)
 */
export function verifyWebhookSignature(opts: {
  rawBody: string;
  signatureHeader: string | null;
  secret: string;
}): boolean {
  const { rawBody, signatureHeader, secret } = opts;
  if (!signatureHeader || !secret) return false;

  const provided = signatureHeader.trim().toLowerCase().replace(/^sha(256|512)=/i, "");
  if (!/^[0-9a-f]+$/.test(provided)) return false;

  const algo = provided.length === 128 ? "sha512" : "sha256";
  const expected = createHmac(algo, secret).update(rawBody, "utf8").digest("hex");

  try {
    const a = Buffer.from(provided, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function normalizeWebhookStatus(payload: WebhookPayload): string {
  const raw = (payload.status ?? payload.payment_status ?? "").toLowerCase();
  return raw;
}

export function isSuccessfulPaymentStatus(status: string) {
  return ["finished", "completed", "confirmed", "paid"].includes(status);
}

export function resolveDepositId(payload: WebhookPayload): string | null {
  return payload.depositId ?? payload.order_id ?? null;
}

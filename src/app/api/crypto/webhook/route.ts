import { createHash } from "crypto";
import { NextResponse } from "next/server";
import {
  RATE_LIMITS,
  assertRateLimit,
  isSuccessfulPaymentStatus,
  normalizeWebhookStatus,
  resolveDepositId,
  verifyWebhookSignature,
  type WebhookPayload,
} from "@/lib/finance";
import { confirmDeposit } from "@/lib/store";

export const runtime = "nodejs";

/**
 * Crypto payment IPN / webhook.
 * Requires `CRYPTOPAY_IPN_SECRET` and a valid HMAC signature header.
 */
export async function POST(request: Request) {
  const secret = process.env.CRYPTOPAY_IPN_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "Webhook secret not configured" },
      { status: 503 },
    );
  }

  const rawBody = await request.text();
  const signature =
    request.headers.get("x-nowpayments-sig") ??
    request.headers.get("x-cryptopay-signature") ??
    request.headers.get("x-signature");

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  try {
    assertRateLimit(
      `webhook:${ip}`,
      RATE_LIMITS.webhook.limit,
      RATE_LIMITS.webhook.windowMs,
      "Rate limited",
    );
  } catch {
    return NextResponse.json({ ok: false, error: "Rate limited" }, { status: 429 });
  }

  if (!verifyWebhookSignature({ rawBody, signatureHeader: signature, secret })) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const depositId = resolveDepositId(payload);
  if (!depositId) {
    return NextResponse.json({ ok: false, error: "depositId required" }, { status: 400 });
  }

  const status = normalizeWebhookStatus(payload);
  if (!isSuccessfulPaymentStatus(status)) {
    return NextResponse.json({ ok: true, ignored: true, status });
  }

  const eventKey =
    payload.eventId ??
    payload.payment_id ??
    payload.txHash ??
    createHash("sha256").update(rawBody).digest("hex");

  try {
    const deposit = await confirmDeposit(depositId, {
      txHash: payload.txHash,
      eventKey: String(eventKey),
      provider: "cryptopay",
      rawPayloadHash: createHash("sha256").update(rawBody).digest("hex"),
    });
    return NextResponse.json({ ok: true, depositId: deposit ? deposit.id : depositId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "confirm failed";
    const statusCode = message.includes("уже учтена") ? 200 : 400;
    return NextResponse.json(
      { ok: statusCode === 200, error: message },
      { status: statusCode },
    );
  }
}

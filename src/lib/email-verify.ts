import { createHash, randomBytes } from "crypto";

export function createEmailVerifyToken() {
  const raw = randomBytes(32).toString("hex");
  const hash = hashEmailToken(raw);
  return { raw, hash };
}

export function hashEmailToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

async function sendViaResend(email: string, url: string) {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return false;
  const from = process.env.EMAIL_FROM?.trim() || "DigiForge <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Подтвердите email — DigiForge",
      html: `<p>Подтвердите email для DigiForge:</p><p><a href="${url}">${url}</a></p><p>Ссылка действует 24 часа.</p>`,
      text: `Подтвердите email: ${url}`,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend failed: ${res.status} ${body.slice(0, 200)}`);
  }
  return true;
}

/** Deliver verification link via Resend; in non-prod falls back to console. */
export async function deliverVerificationLink(email: string, url: string) {
  const sent = await sendViaResend(email, url);
  if (sent) return { channel: "resend" as const };

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "RESEND_API_KEY не задан — нельзя отправить письмо подтверждения в production",
    );
  }

  console.info(`[email-verify] ${email} → ${url}`);
  return { channel: "console" as const, previewUrl: url };
}

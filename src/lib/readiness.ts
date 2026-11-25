import { nowPaymentsConfigured } from "@/lib/crypto/nowpayments";
import { isRelationalStore } from "@/lib/db/mode";

export type ReadinessCheck = {
  id: string;
  ok: boolean;
  required: boolean;
  detail: string;
};

export function getReadinessChecks(): ReadinessCheck[] {
  const isProd = process.env.NODE_ENV === "production";
  const checks: ReadinessCheck[] = [
    {
      id: "database",
      ok: Boolean(process.env.DATABASE_URL?.trim()),
      required: true,
      detail: process.env.DATABASE_URL ? "DATABASE_URL set" : "DATABASE_URL missing",
    },
    {
      id: "session_secret",
      ok: Boolean(
        process.env.NEON_AUTH_COOKIE_SECRET &&
          process.env.NEON_AUTH_COOKIE_SECRET.length >= 16,
      ),
      required: isProd,
      detail:
        process.env.NEON_AUTH_COOKIE_SECRET &&
        process.env.NEON_AUTH_COOKIE_SECRET.length >= 16
          ? "NEON_AUTH_COOKIE_SECRET ok"
          : "NEON_AUTH_COOKIE_SECRET missing or too short (<16)",
    },
    {
      id: "crypto_ipn",
      ok: Boolean(process.env.CRYPTOPAY_IPN_SECRET?.trim()),
      required: isProd,
      detail: process.env.CRYPTOPAY_IPN_SECRET
        ? "CRYPTOPAY_IPN_SECRET set"
        : "CRYPTOPAY_IPN_SECRET missing",
    },
    {
      id: "crypto_api",
      ok: nowPaymentsConfigured(),
      required: isProd,
      detail: nowPaymentsConfigured()
        ? "CRYPTOPAY_API_KEY set"
        : "CRYPTOPAY_API_KEY missing (sim mode)",
    },
    {
      id: "email",
      ok: Boolean(process.env.RESEND_API_KEY?.trim()),
      required: isProd,
      detail: process.env.RESEND_API_KEY
        ? "RESEND_API_KEY set"
        : "RESEND_API_KEY missing",
    },
    {
      id: "store_mode",
      ok: !isProd || isRelationalStore(),
      required: isProd,
      detail: isRelationalStore()
        ? "STORE_MODE=relational"
        : "STORE_MODE should be relational in production",
    },
    {
      id: "demo_flags",
      ok:
        process.env.ALLOW_DEMO_DEPOSIT_AUTOCONFIRM !== "true" &&
        process.env.ALLOW_DEMO_SEED !== "true",
      required: isProd,
      detail:
        process.env.ALLOW_DEMO_DEPOSIT_AUTOCONFIRM === "true" ||
        process.env.ALLOW_DEMO_SEED === "true"
          ? "Demo flags still enabled"
          : "Demo flags off",
    },
    {
      id: "cron_secret",
      ok: Boolean(process.env.CRON_SECRET?.trim()),
      required: isProd,
      detail: process.env.CRON_SECRET ? "CRON_SECRET set" : "CRON_SECRET missing",
    },
    {
      id: "app_url",
      ok: Boolean(process.env.NEXT_PUBLIC_APP_URL?.trim()),
      required: true,
      detail: process.env.NEXT_PUBLIC_APP_URL
        ? `APP_URL=${process.env.NEXT_PUBLIC_APP_URL}`
        : "NEXT_PUBLIC_APP_URL missing",
    },
  ];
  return checks;
}

export function assertProductionReady() {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.SKIP_READINESS_CHECK === "true") return;
  const failed = getReadinessChecks().filter((c) => c.required && !c.ok);
  if (failed.length === 0) return;
  const msg = failed.map((f) => `${f.id}: ${f.detail}`).join("; ");
  throw new Error(`Production readiness failed — ${msg}`);
}

export function isLaunchReady() {
  return getReadinessChecks().every((c) => !c.required || c.ok);
}

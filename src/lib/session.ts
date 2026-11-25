import { createHash, createHmac, timingSafeEqual } from "crypto";

const COOKIE = "df_session";

function configuredSecret() {
  const s = process.env.NEON_AUTH_COOKIE_SECRET;
  if (s && s.length >= 16) return s;
  return null;
}

/** Prefer explicit secret; otherwise derive from DATABASE_URL; else null (legacy cookies). */
function signingSecret(): string | null {
  const configured = configuredSecret();
  if (configured) return configured;
  const db = process.env.DATABASE_URL?.trim();
  if (!db) return null;
  return createHash("sha256").update(`digiforge-session:${db}`).digest("hex");
}

export type SessionPayload = {
  uid: string;
  /** Bumps on password change / clear sessions — invalidates older cookies. */
  v: number;
  /** Issued-at unix seconds */
  iat: number;
};

function b64url(buf: Buffer | string) {
  const b = typeof buf === "string" ? Buffer.from(buf) : buf;
  return b.toString("base64url");
}

function sign(body: string, secret: string) {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

/** Signed token when a secret exists; otherwise plain user id (as before). */
export function createSessionToken(userId: string, sessionVersion: number): string {
  const secret = signingSecret();
  if (!secret) return userId;

  const payload: SessionPayload = {
    uid: userId,
    v: sessionVersion,
    iat: Math.floor(Date.now() / 1000),
  };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body, secret)}`;
}

export function parseSessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token || !token.includes(".")) return null;
  const secret = signingSecret();
  if (!secret) return null;

  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body, secret);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const raw = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!raw?.uid || typeof raw.v !== "number") return null;
    if (!/^u-[\w-]+$/.test(raw.uid)) return null;
    if (Math.floor(Date.now() / 1000) - raw.iat > 60 * 60 * 24 * 30) return null;
    return raw;
  } catch {
    return null;
  }
}

/** Plain `u-…` cookie — the format that worked before signed sessions. */
export function parseLegacyUserIdCookie(value: string | undefined | null): string | null {
  if (!value || !/^u-[\w-]+$/.test(value)) return null;
  return value;
}

export { COOKIE as SESSION_COOKIE };

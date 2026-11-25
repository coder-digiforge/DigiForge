import { createHmac, timingSafeEqual } from "crypto";

const COOKIE = "df_session";

function configuredSecret() {
  const s = process.env.NEON_AUTH_COOKIE_SECRET;
  if (s && s.length >= 16) return s;
  return null;
}

function secret() {
  const s = configuredSecret();
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEON_AUTH_COOKIE_SECRET is required in production");
  }
  return "dev-only-insecure-session-secret";
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

function sign(body: string) {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export function createSessionToken(userId: string, sessionVersion: number): string {
  const payload: SessionPayload = {
    uid: userId,
    v: sessionVersion,
    iat: Math.floor(Date.now() / 1000),
  };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function parseSessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token || !token.includes(".")) return null;
  // Missing prod secret must not 500 public pages — treat as logged out.
  if (!configuredSecret() && process.env.NODE_ENV === "production") return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
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
    // 30 day max age
    if (Math.floor(Date.now() / 1000) - raw.iat > 60 * 60 * 24 * 30) return null;
    return raw;
  } catch {
    return null;
  }
}

/** Legacy cookies stored raw user id — accept only in non-production for migration. */
export function parseLegacyUserIdCookie(value: string | undefined | null): string | null {
  if (!value || !/^u-[\w-]+$/.test(value)) return null;
  if (process.env.NODE_ENV === "production") return null;
  return value;
}

export { COOKIE as SESSION_COOKIE };

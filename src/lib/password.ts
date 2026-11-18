import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const PREFIX = "scrypt";
const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEYLEN).toString("hex");
  return `${PREFIX}:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored.startsWith(`${PREFIX}:`)) {
    // Legacy plaintext seed / old rows — constant-time-ish compare via hmac length pad
    const a = Buffer.from(password);
    const b = Buffer.from(stored);
    if (a.length !== b.length) {
      // still do a dummy compare to reduce trivial timing oracle
      timingSafeEqual(Buffer.alloc(32), Buffer.alloc(32));
      return false;
    }
    return timingSafeEqual(a, b);
  }

  const parts = stored.split(":");
  if (parts.length !== 3) return false;
  const [, salt, hash] = parts;
  const test = scryptSync(password, salt, KEYLEN);
  const expected = Buffer.from(hash, "hex");
  if (expected.length !== test.length) return false;
  return timingSafeEqual(expected, test);
}

export function needsRehash(stored: string) {
  return !stored.startsWith(`${PREFIX}:`);
}

import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateTotpSecret(bytes = 20): string {
  const buf = randomBytes(bytes);
  let bits = 0;
  let value = 0;
  let out = "";
  for (const b of buf) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(secret: string): Buffer {
  const cleaned = secret.replace(/=+$/, "").toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const c of cleaned) {
    const idx = BASE32.indexOf(c);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1_000_000).padStart(6, "0");
}

export function generateTotpCode(secretBase32: string, stepSec = 30, at = Date.now()): string {
  const counter = Math.floor(at / 1000 / stepSec);
  return hotp(base32Decode(secretBase32), counter);
}

export function verifyTotpCode(
  secretBase32: string,
  code: string,
  window = 1,
  stepSec = 30,
): boolean {
  const cleaned = String(code).replace(/\s/g, "");
  if (!/^\d{6}$/.test(cleaned)) return false;
  const now = Date.now();
  for (let w = -window; w <= window; w++) {
    const expected = generateTotpCode(secretBase32, stepSec, now + w * stepSec * 1000);
    const a = Buffer.from(cleaned);
    const b = Buffer.from(expected);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}

export function otpauthUri(opts: {
  secret: string;
  email: string;
  issuer?: string;
}) {
  const issuer = opts.issuer ?? "DigiForge";
  const label = encodeURIComponent(`${issuer}:${opts.email}`);
  const params = new URLSearchParams({
    secret: opts.secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

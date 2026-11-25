/**
 * Local readiness check (mirrors /api/health logic without Next).
 * Usage: npm run ready
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const raw = readFileSync(resolve(__dirname, "../.env"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const k = m[1].trim();
    const v = m[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
} catch {
  /* optional */
}

// Simulate production gate unless --dev
const forceProd = !process.argv.includes("--dev");
if (forceProd) process.env.NODE_ENV = "production";

const checks = [
  ["DATABASE_URL", Boolean(process.env.DATABASE_URL?.trim())],
  [
    "NEON_AUTH_COOKIE_SECRET",
    Boolean(process.env.NEON_AUTH_COOKIE_SECRET && process.env.NEON_AUTH_COOKIE_SECRET.length >= 16),
  ],
  ["CRYPTOPAY_API_KEY", Boolean(process.env.CRYPTOPAY_API_KEY?.trim())],
  ["CRYPTOPAY_IPN_SECRET", Boolean(process.env.CRYPTOPAY_IPN_SECRET?.trim())],
  ["RESEND_API_KEY", Boolean(process.env.RESEND_API_KEY?.trim())],
  ["CRON_SECRET", Boolean(process.env.CRON_SECRET?.trim())],
  ["NEXT_PUBLIC_APP_URL", Boolean(process.env.NEXT_PUBLIC_APP_URL?.trim())],
  [
    "STORE_MODE",
    (process.env.STORE_MODE ?? "").toLowerCase() === "relational" ||
      (!process.env.STORE_MODE && process.env.NODE_ENV === "production"),
  ],
  ["ALLOW_DEMO_* off", process.env.ALLOW_DEMO_DEPOSIT_AUTOCONFIRM !== "true" && process.env.ALLOW_DEMO_SEED !== "true"],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? "OK " : "FAIL"} ${name}`);
  if (!ok) failed += 1;
}

if (failed) {
  console.log(`\n${failed} checks failed — fill .env (see .env.example)`);
  process.exit(1);
}
console.log("\nReady for production launch config.");

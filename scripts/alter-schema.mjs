/**
 * Add missing columns/indexes to an already-created DigiForge schema.
 */
import { neon } from "@neondatabase/serverless";
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

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const sql = neon(url);

const stmts = [
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS two_fa_secret text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS two_fa_pending_secret text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version int NOT NULL DEFAULT 0`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at timestamptz`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verify_token_hash text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verify_expires_at timestamptz`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS digi_prime_until timestamptz`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS sensitive_changed_at timestamptz`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_at timestamptz`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_json jsonb NOT NULL DEFAULT '{}'::jsonb`,
  `ALTER TABLE deals ADD COLUMN IF NOT EXISTS fee_percent numeric(5,2) NOT NULL DEFAULT 10`,
  `ALTER TABLE deals ADD COLUMN IF NOT EXISTS fee_amount numeric(18,2) NOT NULL DEFAULT 0`,
  `ALTER TABLE deals ADD COLUMN IF NOT EXISTS funded_at timestamptz`,
  `ALTER TABLE deals ADD COLUMN IF NOT EXISTS delivered_at timestamptz`,
  `ALTER TABLE deals ADD COLUMN IF NOT EXISTS released_at timestamptz`,
  `ALTER TABLE deals ADD COLUMN IF NOT EXISTS disputed_at timestamptz`,
  `ALTER TABLE deals ADD COLUMN IF NOT EXISTS funding_deadline_at timestamptz`,
  `ALTER TABLE deals ADD COLUMN IF NOT EXISTS auto_release_at timestamptz`,
  `ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS reviewed_by text`,
  `ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS reviewed_at timestamptz`,
  `ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS reject_reason text`,
  `ALTER TABLE deposits ADD COLUMN IF NOT EXISTS provider_ref text`,
  `ALTER TABLE deposits ADD COLUMN IF NOT EXISTS invoice_url text`,
  `ALTER TABLE deposits ADD COLUMN IF NOT EXISTS pay_amount numeric(18,2)`,
  `ALTER TABLE deposits ADD COLUMN IF NOT EXISTS pay_currency text`,
  `ALTER TABLE deposits ADD COLUMN IF NOT EXISTS provider_simulated boolean NOT NULL DEFAULT false`,
  `ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS provider_ref text`,
  `ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS provider_simulated boolean NOT NULL DEFAULT false`,
  `ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS deposit_id text`,
  `ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS withdrawal_id text`,
  `ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_json jsonb`,
  `ALTER TABLE portfolio_cases ADD COLUMN IF NOT EXISTS price_usdt numeric(18,2)`,
  `ALTER TABLE portfolio_cases ADD COLUMN IF NOT EXISTS project_url text`,
  `CREATE TABLE IF NOT EXISTS store_meta (
    id text primary key,
    version int not null default 0,
    finance_policy_version int not null default 1,
    updated_at timestamptz not null default now()
  )`,
  `CREATE TABLE IF NOT EXISTS rate_limit_buckets (
    bucket_key text primary key,
    timestamps timestamptz[] not null default '{}',
    updated_at timestamptz not null default now()
  )`,
  `CREATE INDEX IF NOT EXISTS deals_auto_release_idx ON deals (auto_release_at) WHERE auto_release_at IS NOT NULL`,
  `CREATE INDEX IF NOT EXISTS deposits_status_idx ON deposits (status)`,
  // Freelancehunt-style: fixed budget or null (no from–to range)
  `ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget numeric(18,2)`,
  `UPDATE projects SET budget = ROUND((COALESCE(budget_min, 0) + COALESCE(budget_max, 0)) / 2, 2)
   WHERE budget IS NULL AND (budget_min IS NOT NULL OR budget_max IS NOT NULL)`,
  `UPDATE projects SET budget = NULL WHERE budget IS NOT NULL AND budget <= 0`,
];

for (const stmt of stmts) {
  try {
    await sql.query(stmt);
    console.log("ok:", stmt.slice(0, 72).replace(/\s+/g, " "));
  } catch (e) {
    console.warn("fail:", e instanceof Error ? e.message.slice(0, 120) : e);
  }
}

console.log("Alter done.");

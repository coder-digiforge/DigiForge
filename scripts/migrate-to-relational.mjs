/**
 * Backfill relational tables from app_store JSON (ordered for FKs).
 * Prerequisites: npm run db:schema && npm run db:alter
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
const rows = await sql`SELECT payload FROM app_store WHERE id = 'main' LIMIT 1`;
if (!rows[0]?.payload) {
  console.error("app_store.main missing — start the app once to bootstrap");
  process.exit(1);
}

const db = rows[0].payload;
const meta = db.meta ?? { version: 0, financePolicyVersion: 1 };
const counts = {};

async function step(name, fn) {
  try {
    counts[name] = await fn();
  } catch (e) {
    console.error(`fail ${name}:`, e instanceof Error ? e.message : e);
    throw e;
  }
}

await step("store_meta", async () => {
  await sql`INSERT INTO store_meta (id, version, finance_policy_version)
    VALUES ('main', ${meta.version ?? 0}, ${meta.financePolicyVersion ?? 1})
    ON CONFLICT (id) DO UPDATE SET
      version = EXCLUDED.version,
      finance_policy_version = EXCLUDED.finance_policy_version,
      updated_at = now()`;
  return 1;
});

await step("users", async () => {
  let n = 0;
  for (const u of db.users ?? []) {
    await sql`
      INSERT INTO users (
        id, email, password_hash, name, role, skills, rating, review_count,
        two_fa_enabled, session_version, email_verified_at, created_at
      ) VALUES (
        ${u.id}, ${u.email}, ${u.password}, ${u.name}, ${u.role}::user_role,
        ${u.skills ?? []}, ${u.rating ?? 0}, ${u.reviewCount ?? 0},
        ${Boolean(u.twoFaEnabled)}, ${u.sessionVersion ?? 0},
        ${u.emailVerifiedAt ?? null}, ${u.createdAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        session_version = EXCLUDED.session_version
    `;
    n += 1;
  }
  return n;
});

await step("projects", async () => {
  let n = 0;
  for (const p of db.projects ?? []) {
    await sql`
      INSERT INTO projects (
        id, client_id, title, description, category, budget,
        currency, deadline_days, status, bids_hidden, created_at
      ) VALUES (
        ${p.id}, ${p.clientId}, ${p.title}, ${p.description}, ${p.category},
        ${p.budget ?? (p.budgetMin != null && p.budgetMax != null
          ? Math.round((Number(p.budgetMin) + Number(p.budgetMax)) / 2)
          : p.budgetMin ?? p.budgetMax ?? null)},
        ${p.currency ?? "USDT"}, ${p.deadlineDays},
        ${p.status}::project_status, ${Boolean(p.bidsHidden)}, ${p.createdAt}
      )
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, title = EXCLUDED.title
    `;
    n += 1;
  }
  return n;
});

await step("bids", async () => {
  let n = 0;
  for (const b of db.bids ?? []) {
    await sql`
      INSERT INTO bids (
        id, project_id, freelancer_id, amount, days, comment,
        transfer_copyright, hide_from_others, status, created_at
      ) VALUES (
        ${b.id}, ${b.projectId}, ${b.freelancerId}, ${b.amount}, ${b.days},
        ${b.comment}, ${Boolean(b.transferCopyright)}, ${Boolean(b.hideFromOthers)},
        ${b.status ?? "pending"}, ${b.createdAt}
      )
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, amount = EXCLUDED.amount
    `;
    n += 1;
  }
  return n;
});

await step("deals", async () => {
  let n = 0;
  for (const d of db.deals ?? []) {
    await sql`
      INSERT INTO deals (
        id, project_id, client_id, freelancer_id, bid_id, amount, fee_percent,
        fee_amount, status, funded_at, delivered_at, released_at, disputed_at,
        funding_deadline_at, auto_release_at, created_at
      ) VALUES (
        ${d.id}, ${d.projectId}, ${d.clientId}, ${d.freelancerId}, ${d.bidId},
        ${d.amount}, ${d.feePercent ?? 10}, ${d.feeAmount ?? 0},
        ${d.status}::escrow_status, ${d.fundedAt ?? null}, ${d.deliveredAt ?? null},
        ${d.releasedAt ?? null}, ${d.disputedAt ?? null}, ${d.fundingDeadlineAt ?? null},
        ${d.autoReleaseAt ?? null}, ${d.createdAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        fee_amount = EXCLUDED.fee_amount,
        auto_release_at = EXCLUDED.auto_release_at
    `;
    n += 1;
  }
  return n;
});

await step("deposits", async () => {
  let n = 0;
  for (const d of db.deposits ?? []) {
    await sql`
      INSERT INTO deposits (
        id, user_id, amount, asset, network, address, status, tx_hash,
        provider_ref, expires_at, completed_at, created_at
      ) VALUES (
        ${d.id}, ${d.userId}, ${d.amount}, ${d.asset}::crypto_asset,
        ${d.network}::crypto_network, ${d.address}, ${d.status}::deposit_status,
        ${d.txHash ?? null}, ${d.providerRef ?? null}, ${d.expiresAt},
        ${d.completedAt ?? null}, ${d.createdAt}
      )
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, tx_hash = EXCLUDED.tx_hash
    `;
    n += 1;
  }
  return n;
});

await step("withdrawals", async () => {
  let n = 0;
  for (const w of db.withdrawals ?? []) {
    await sql`
      INSERT INTO withdrawals (
        id, user_id, amount, asset, network, address, status, tx_hash, created_at
      ) VALUES (
        ${w.id}, ${w.userId}, ${w.amount}, ${w.asset}::crypto_asset,
        ${w.network}::crypto_network, ${w.address}, ${w.status}::withdrawal_status,
        ${w.txHash ?? null}, ${w.createdAt}
      )
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, tx_hash = EXCLUDED.tx_hash
    `;
    n += 1;
  }
  return n;
});

await step("ledger", async () => {
  let n = 0;
  for (const e of db.ledger ?? []) {
    await sql`
      INSERT INTO ledger_entries (
        id, user_id, kind, amount, asset, network, note, tx_hash, deal_id,
        deposit_id, withdrawal_id, created_at, settled_at
      ) VALUES (
        ${e.id}, ${e.userId}, ${e.kind}::ledger_kind, ${e.amount},
        ${e.asset}::crypto_asset, ${e.network ?? null}, ${e.note},
        ${e.txHash ?? null}, ${e.dealId ?? null}, ${e.depositId ?? null},
        ${e.withdrawalId ?? null}, ${e.createdAt}, ${e.settledAt ?? null}
      )
      ON CONFLICT (id) DO NOTHING
    `;
    n += 1;
  }
  return n;
});

console.log("Migrated:", counts);
console.log("Set STORE_MODE=relational for ongoing sync on writes.");

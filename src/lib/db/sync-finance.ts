import type { DbShape } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sql = (strings: TemplateStringsArray, ...values: any[]) => Promise<any>;

/**
 * Upsert finance-critical rows so unique indexes enforce idempotency
 * even while the JSON document remains the working copy.
 */
export async function syncFinanceTables(sql: Sql, db: DbShape) {
  await sql`INSERT INTO store_meta (id, version, finance_policy_version)
    VALUES ('main', ${db.meta.version}, ${db.meta.financePolicyVersion})
    ON CONFLICT (id) DO UPDATE SET
      version = EXCLUDED.version,
      finance_policy_version = EXCLUDED.finance_policy_version,
      updated_at = now()`;

  for (const u of db.users) {
    await sql`
      INSERT INTO users (
        id, email, password_hash, name, role, title, bio, skills, rating, review_count,
        wallet_address, wallet_network, wallet_asset, two_fa_enabled, two_fa_secret,
        two_fa_pending_secret, session_version, email_verified_at, email_verify_token_hash,
        email_verify_expires_at, digi_prime_until, sensitive_changed_at, deactivated_at,
        profile_json, created_at
      ) VALUES (
        ${u.id}, ${u.email}, ${u.password}, ${u.name}, ${u.role}::user_role,
        ${u.title ?? null}, ${u.bio ?? null}, ${u.skills}, ${u.rating}, ${u.reviewCount},
        ${u.walletAddress ?? null}, ${u.walletNetwork ?? null}, ${u.walletAsset ?? null},
        ${u.twoFaEnabled}, ${u.twoFaSecret ?? null}, ${u.twoFaPendingSecret ?? null},
        ${u.sessionVersion ?? 0}, ${u.emailVerifiedAt ?? null}, ${u.emailVerifyTokenHash ?? null},
        ${u.emailVerifyExpiresAt ?? null}, ${u.digiPrimeUntil ?? null},
        ${u.sensitiveChangedAt ?? null}, ${u.deactivatedAt ?? null},
        ${JSON.stringify({
          avatarUrl: u.avatarUrl,
          settings: u.settings,
          loginLog: u.loginLog,
          workStatus: u.workStatus,
          legalForm: u.legalForm,
          motto: u.motto,
          bidSignature: u.bidSignature,
          autoAddBidSignature: u.autoAddBidSignature,
          profileI18n: u.profileI18n,
          digiPrimeTrial: u.digiPrimeTrial,
          digiPrimeTrialUsed: u.digiPrimeTrialUsed,
          digiPrimeAutoRenew: u.digiPrimeAutoRenew,
        })}::jsonb,
        ${u.createdAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        title = EXCLUDED.title,
        bio = EXCLUDED.bio,
        skills = EXCLUDED.skills,
        rating = EXCLUDED.rating,
        review_count = EXCLUDED.review_count,
        wallet_address = EXCLUDED.wallet_address,
        wallet_network = EXCLUDED.wallet_network,
        wallet_asset = EXCLUDED.wallet_asset,
        two_fa_enabled = EXCLUDED.two_fa_enabled,
        two_fa_secret = EXCLUDED.two_fa_secret,
        two_fa_pending_secret = EXCLUDED.two_fa_pending_secret,
        session_version = EXCLUDED.session_version,
        email_verified_at = EXCLUDED.email_verified_at,
        email_verify_token_hash = EXCLUDED.email_verify_token_hash,
        email_verify_expires_at = EXCLUDED.email_verify_expires_at,
        digi_prime_until = EXCLUDED.digi_prime_until,
        sensitive_changed_at = EXCLUDED.sensitive_changed_at,
        deactivated_at = EXCLUDED.deactivated_at,
        profile_json = EXCLUDED.profile_json
    `;
  }

  for (const d of db.deals) {
    await sql`
      INSERT INTO deals (
        id, project_id, client_id, freelancer_id, bid_id, amount, fee_percent, fee_amount,
        status, funded_at, delivered_at, released_at, disputed_at, funding_deadline_at,
        auto_release_at, created_at
      ) VALUES (
        ${d.id}, ${d.projectId}, ${d.clientId}, ${d.freelancerId}, ${d.bidId},
        ${d.amount}, ${d.feePercent}, ${d.feeAmount}, ${d.status}::escrow_status,
        ${d.fundedAt ?? null}, ${d.deliveredAt ?? null},
        ${d.releasedAt ?? null}, ${d.disputedAt ?? null}, ${d.fundingDeadlineAt ?? null},
        ${d.autoReleaseAt ?? null}, ${d.createdAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        funded_at = EXCLUDED.funded_at,
        delivered_at = EXCLUDED.delivered_at,
        released_at = EXCLUDED.released_at,
        disputed_at = EXCLUDED.disputed_at,
        funding_deadline_at = EXCLUDED.funding_deadline_at,
        auto_release_at = EXCLUDED.auto_release_at,
        fee_amount = EXCLUDED.fee_amount,
        fee_percent = EXCLUDED.fee_percent
    `;
  }

  for (const dep of db.deposits) {
    await sql`
      INSERT INTO deposits (
        id, user_id, amount, asset, network, address, status, tx_hash, provider_ref,
        invoice_url, pay_amount, pay_currency, provider_simulated, expires_at, completed_at, created_at
      ) VALUES (
        ${dep.id}, ${dep.userId}, ${dep.amount}, ${dep.asset}::crypto_asset,
        ${dep.network}::crypto_network, ${dep.address}, ${dep.status}::deposit_status,
        ${dep.txHash ?? null}, ${dep.providerRef ?? null}, ${dep.invoiceUrl ?? null},
        ${dep.payAmount ?? null}, ${dep.payCurrency ?? null}, ${dep.providerSimulated ?? false},
        ${dep.expiresAt}, ${dep.completedAt ?? null}, ${dep.createdAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        tx_hash = EXCLUDED.tx_hash,
        provider_ref = EXCLUDED.provider_ref,
        invoice_url = EXCLUDED.invoice_url,
        completed_at = EXCLUDED.completed_at,
        provider_simulated = EXCLUDED.provider_simulated
    `;
  }

  for (const wd of db.withdrawals) {
    await sql`
      INSERT INTO withdrawals (
        id, user_id, amount, asset, network, address, status, tx_hash, provider_ref,
        provider_simulated, reviewed_by, reviewed_at, reject_reason, created_at
      ) VALUES (
        ${wd.id}, ${wd.userId}, ${wd.amount}, ${wd.asset}::crypto_asset,
        ${wd.network}::crypto_network, ${wd.address}, ${wd.status}::withdrawal_status,
        ${wd.txHash ?? null}, ${wd.providerRef ?? null}, ${wd.providerSimulated ?? false},
        ${wd.reviewedBy ?? null}, ${wd.reviewedAt ?? null}, ${wd.rejectReason ?? null},
        ${wd.createdAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        tx_hash = EXCLUDED.tx_hash,
        provider_ref = EXCLUDED.provider_ref,
        provider_simulated = EXCLUDED.provider_simulated,
        reviewed_by = EXCLUDED.reviewed_by,
        reviewed_at = EXCLUDED.reviewed_at,
        reject_reason = EXCLUDED.reject_reason
    `;
  }

  for (const e of db.ledger) {
    await sql`
      INSERT INTO ledger_entries (
        id, user_id, kind, amount, asset, network, note, tx_hash, deal_id, deposit_id,
        withdrawal_id, created_at, settled_at
      ) VALUES (
        ${e.id}, ${e.userId}, ${e.kind}::ledger_kind, ${e.amount}, ${e.asset}::crypto_asset,
        ${e.network ?? null}, ${e.note}, ${e.txHash ?? null}, ${e.dealId ?? null},
        ${e.depositId ?? null}, ${e.withdrawalId ?? null}, ${e.createdAt}, ${e.settledAt ?? null}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  for (const a of db.auditLog.slice(-500)) {
    await sql`
      INSERT INTO audit_log (id, at, actor_user_id, action, entity_type, entity_id, ip, meta)
      VALUES (
        ${a.id}, ${a.at}, ${a.actorUserId ?? null}, ${a.action},
        ${a.entityType ?? null}, ${a.entityId ?? null}, ${a.ip ?? null},
        ${JSON.stringify(a.meta ?? {})}::jsonb
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  for (const w of db.webhookEvents) {
    await sql`
      INSERT INTO webhook_events (id, provider, event_key, deposit_id, payload_hash, status, created_at)
      VALUES (
        ${w.id}, ${w.provider}, ${w.eventKey}, ${w.depositId ?? null},
        ${w.payloadHash}, ${w.status}, ${w.createdAt}
      )
      ON CONFLICT (provider, event_key) DO NOTHING
    `;
  }
}

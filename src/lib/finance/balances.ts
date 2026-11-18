import type { DbShape, WalletBalances } from "@/lib/types";
import { OPEN_ESCROW_STATUSES } from "./constants";
import { normalizeUsdt } from "./validate";

/**
 * Available = sum of settled ledger effects that are spendable.
 * Escrow = open client-side deal amounts (authoritative for "сейф").
 * Pending withdraw = holds not yet approved/rejected.
 */
export function calcBalances(db: DbShape, userId: string): WalletBalances {
  const entries = db.ledger.filter((e) => e.userId === userId);
  let available = 0;
  let pendingWithdraw = 0;

  for (const e of entries) {
    switch (e.kind) {
      case "escrow_lock":
        // Locked out of available; escrow total comes from deals.
        available += e.amount;
        break;
      case "withdraw_hold":
        available += e.amount; // negative
        pendingWithdraw += Math.abs(e.amount);
        break;
      case "withdraw_release":
        available += e.amount; // positive refund of hold
        break;
      case "withdraw":
        // Completed on-chain send — already removed via hold; ignore if paired.
        // Legacy seed rows may use bare withdraw without hold.
        if (!e.withdrawalId) {
          available += e.amount;
        }
        break;
      default:
        available += e.amount;
        break;
    }
  }

  // Holds that were released should not count as pending.
  const openHoldIds = new Set(
    db.withdrawals
      .filter((w) => w.userId === userId && (w.status === "pending" || w.status === "processing"))
      .map((w) => w.id),
  );
  pendingWithdraw = entries
    .filter((e) => e.kind === "withdraw_hold" && e.withdrawalId && openHoldIds.has(e.withdrawalId))
    .reduce((s, e) => s + Math.abs(e.amount), 0);

  const openEscrow = db.deals
    .filter(
      (d) =>
        d.clientId === userId &&
        (OPEN_ESCROW_STATUSES as readonly string[]).includes(d.status),
    )
    .reduce((sum, d) => sum + d.amount, 0);

  return {
    available: Math.max(0, normalizeUsdt(available)),
    escrow: normalizeUsdt(openEscrow),
    pendingWithdraw: normalizeUsdt(pendingWithdraw),
  };
}

/** Invariant check used after money mutations (dev/admin diagnostics). */
export function assertNonNegativeAvailable(db: DbShape, userId: string) {
  const bal = calcBalances(db, userId);
  if (bal.available < 0) {
    throw new Error("Инвариант баланса нарушен: available < 0");
  }
}

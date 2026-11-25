/** Platform fee snapshot default when creating a deal. */
export const DEFAULT_FEE_PERCENT = 10;

/** Digi Prime list price (USDT). */
export const DIGI_PRIME_PRICE_USDT = 29;
export const DIGI_PRIME_DAYS = 30;
/** Launch promo: free DigiPrime days granted on freelancer registration. */
export const DIGI_PRIME_LAUNCH_DAYS = 60;

/** Money limits (USDT). */
export const MIN_DEPOSIT_USDT = 1;
export const MAX_DEPOSIT_USDT = 100_000;
export const MIN_WITHDRAW_USDT = 10;
export const MAX_WITHDRAW_USDT = 50_000;
export const MAX_WITHDRAW_PER_DAY_USDT = 20_000;

/** Withdrawals above this require 2FA enabled on the account. */
export const WITHDRAW_REQUIRES_2FA_USDT = 100;

/**
 * After password / email / wallet change, block withdrawals for this window.
 * Reduces account-takeover drain risk.
 */
export const SENSITIVE_CHANGE_WITHDRAW_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/** Unfunded deals auto-cancel after this many hours. */
export const PENDING_FUNDING_TTL_HOURS = 48;

/** Deposit invoices expire if unpaid. */
export const DEPOSIT_TTL_HOURS = 2;

/** After deliver, auto-release if client does not act. */
export const AUTO_RELEASE_AFTER_DELIVER_HOURS = 72;

/** Optimistic concurrency retries for store writes. */
export const STORE_CAS_RETRIES = 5;

/** Finance action rate limits (sliding window). */
export const RATE_LIMITS = {
  deposit: { limit: 10, windowMs: 60 * 60 * 1000 },
  withdraw: { limit: 5, windowMs: 60 * 60 * 1000 },
  fund: { limit: 20, windowMs: 60 * 60 * 1000 },
  webhook: { limit: 120, windowMs: 60 * 1000 },
} as const;

export const PLATFORM_FEE_USER_ID = "u-admin";

export const OPEN_ESCROW_STATUSES = [
  "funded",
  "in_progress",
  "delivered",
  "disputed",
] as const;

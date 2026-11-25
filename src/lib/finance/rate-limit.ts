import { neon } from "@neondatabase/serverless";

type Bucket = { timestamps: number[] };

const memoryBuckets = new Map<string, Bucket>;

function getSqlOptional() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    return neon(url);
  } catch {
    return null;
  }
}

/**
 * Sliding-window rate limiter.
 * Uses Neon `rate_limit_buckets` when STORE_MODE=relational (or table exists);
 * falls back to in-process memory.
 */
export function assertRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  message = "Слишком много запросов. Подождите и повторите.",
) {
  const now = Date.now();
  const useDb = (process.env.STORE_MODE ?? "json").toLowerCase() === "relational";

  if (useDb) {
    // Sync path for server actions: fire-and-forget sync is unsafe;
    // use memory + best-effort DB persist via void promise below.
    assertMemory(key, limit, windowMs, now, message);
    void persistBucket(key, windowMs).catch(() => {
      /* best-effort */
    });
    return;
  }

  assertMemory(key, limit, windowMs, now, message);
}

function assertMemory(
  key: string,
  limit: number,
  windowMs: number,
  now: number,
  message: string,
) {
  const bucket = memoryBuckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
  if (bucket.timestamps.length >= limit) {
    memoryBuckets.set(key, bucket);
    throw new Error(message);
  }
  bucket.timestamps.push(now);
  memoryBuckets.set(key, bucket);
}

async function persistBucket(key: string, windowMs: number) {
  const sql = getSqlOptional();
  if (!sql) return;
  const bucket = memoryBuckets.get(key);
  if (!bucket) return;
  const cutoff = Date.now() - windowMs;
  const timestamps = bucket.timestamps.filter((t) => t >= cutoff);
  const iso = timestamps.map((t) => new Date(t).toISOString());
  await sql`
    INSERT INTO rate_limit_buckets (bucket_key, timestamps, updated_at)
    VALUES (${key}, ${iso}::timestamptz[], now())
    ON CONFLICT (bucket_key) DO UPDATE SET
      timestamps = EXCLUDED.timestamps,
      updated_at = now()
  `;
}

/** Test helper */
export function _resetRateLimitMemory() {
  memoryBuckets.clear();
}

type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

/**
 * In-process sliding-window rate limiter.
 * Good enough for single-instance / serverless warm isolates;
 * pair with edge WAF for production scale.
 */
export function assertRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  message = "Слишком много запросов. Подождите и повторите.",
) {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
  if (bucket.timestamps.length >= limit) {
    buckets.set(key, bucket);
    throw new Error(message);
  }
  bucket.timestamps.push(now);
  buckets.set(key, bucket);
}

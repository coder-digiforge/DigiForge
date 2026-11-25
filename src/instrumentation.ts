export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { getReadinessChecks } = await import("@/lib/readiness");
  const failed = getReadinessChecks().filter((c) => c.required && !c.ok);
  if (failed.length === 0) return;
  const msg = failed.map((f) => `${f.id}: ${f.detail}`).join("; ");
  // Do not crash the whole site — /api/health still reports 503 until env is complete.
  console.error("[readiness] not ready —", msg);
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { assertProductionReady } = await import("@/lib/readiness");
  try {
    assertProductionReady();
  } catch (e) {
    console.error("[readiness]", e instanceof Error ? e.message : e);
    // Fail hard in production so misconfigured deploy does not serve money flows.
    if (process.env.NODE_ENV === "production") throw e;
  }
}

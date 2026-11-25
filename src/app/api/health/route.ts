import { NextResponse } from "next/server";
import { getReadinessChecks, isLaunchReady } from "@/lib/readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const checks = getReadinessChecks();
  const ready = isLaunchReady();
  return NextResponse.json(
    {
      ok: ready,
      ready,
      env: process.env.NODE_ENV,
      checks,
    },
    { status: ready ? 200 : 503 },
  );
}

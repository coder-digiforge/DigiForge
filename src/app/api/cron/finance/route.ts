import { NextResponse } from "next/server";
import { runFinanceMaintenanceJobs } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/** Vercel Cron / manual: expire deposits, cancel unfunded deals, auto-release. */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const summary = await runFinanceMaintenanceJobs();
    return NextResponse.json({ ok: true, summary });
  } catch (e) {
    const message = e instanceof Error ? e.message : "cron failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}

import { NextResponse } from "next/server";
import { confirmDeposit } from "@/lib/store";

/** Provider webhook stub (NOWPayments / OxaPay). */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    depositId?: string;
    status?: string;
  } | null;

  if (!body?.depositId) {
    return NextResponse.json({ ok: false, error: "depositId required" }, { status: 400 });
  }

  if (body.status && body.status !== "finished" && body.status !== "completed") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const deposit = await confirmDeposit(body.depositId);
  return NextResponse.json({ ok: true, deposit });
}

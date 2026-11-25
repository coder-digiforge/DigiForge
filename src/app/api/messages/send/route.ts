import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { saveChatUpload } from "@/lib/uploads";
import { sendMessage } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const threadId = String(form.get("threadId") ?? "");
    const body = String(form.get("body") ?? "").trim();
    const file = form.get("file");

    let attachment: Awaited<ReturnType<typeof saveChatUpload>> = null;
    if (file instanceof File && file.size > 0) {
      attachment = await saveChatUpload(file);
    }
    if (!threadId || (!body && !attachment)) {
      return NextResponse.json({ ok: false, error: "Пустое сообщение" }, { status: 400 });
    }

    const message = await sendMessage(threadId, user.id, body, attachment ?? undefined);
    return NextResponse.json({ ok: true, message });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Не удалось отправить";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

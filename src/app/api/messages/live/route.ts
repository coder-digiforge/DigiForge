import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getThreadPreviews } from "@/lib/messages";
import { getMessages, getUnreadMessageSummary, markThreadRead } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const threadId = url.searchParams.get("threadId");
  const markRead = url.searchParams.get("markRead") === "1";

  if (threadId && markRead) {
    try {
      await markThreadRead(user.id, threadId);
    } catch {
      // ignore mark failures for polling
    }
  }

  const [threads, unread] = await Promise.all([
    getThreadPreviews(user.id),
    getUnreadMessageSummary(user.id),
  ]);

  const messages = threadId ? await getMessages(threadId) : [];

  return NextResponse.json({
    ok: true,
    unreadTotal: unread.total,
    unreadByThread: unread.byThread,
    threads,
    messages,
    threadId,
    serverTime: new Date().toISOString(),
  });
}

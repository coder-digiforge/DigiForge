import { getDb, getMessages, getThreadsForUser, countUnreadInThread } from "./store";
import type { ThreadPreview } from "@/components/MessagesPanel";

function previewBody(last: Awaited<ReturnType<typeof getMessages>>[number] | undefined) {
  if (!last) return undefined;
  if (last.kind === "system") {
    return last.body;
  }
  if (last.body) return last.body;
  if (last.attachment) return `📎 ${last.attachment.name}`;
  return undefined;
}

export async function getThreadPreviews(userId: string): Promise<ThreadPreview[]> {
  const threads = await getThreadsForUser(userId);
  const db = await getDb();

  const previews = await Promise.all(
    threads.map(async (t) => {
      const peerId = t.participantIds.find((id) => id !== userId) ?? t.participantIds[0];
      const peer = db.users.find((u) => u.id === peerId);
      const msgs = await getMessages(t.id);
      const last = msgs[msgs.length - 1];
      const unreadCount = countUnreadInThread(db, t.id, userId);
      const deal = t.dealId ? db.deals.find((d) => d.id === t.dealId) : undefined;
      return {
        ...t,
        peerName: peer?.name ?? "Собеседник",
        lastBody: previewBody(last),
        unreadCount,
        dealStatus: deal?.status,
        dealAmount: deal?.amount,
      } satisfies ThreadPreview;
    }),
  );

  return previews;
}

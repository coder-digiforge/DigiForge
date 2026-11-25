import { getDb, getMessages, getThreadsForUser, countUnreadInThread } from "./store";
import type { ThreadPreview } from "@/components/MessagesPanel";

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
      return {
        ...t,
        peerName: peer?.name ?? "Собеседник",
        lastBody: last?.body || (last?.attachment ? `📎 ${last.attachment.name}` : undefined),
        unreadCount,
      } satisfies ThreadPreview;
    }),
  );

  return previews;
}

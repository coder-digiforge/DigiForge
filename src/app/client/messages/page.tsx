import { MessagesPanel } from "@/components/MessagesPanel";
import { requireUser } from "@/lib/auth";
import { getThreadPreviews } from "@/lib/messages";

export default async function ClientMessagesPage() {
  const user = await requireUser(["client"]);
  const threads = await getThreadPreviews(user.id);
  return (
    <MessagesPanel
      threads={threads}
      messages={[]}
      basePath="/client/messages"
      currentUserId={user.id}
      subtitle="Диалоги с исполнителями"
    />
  );
}

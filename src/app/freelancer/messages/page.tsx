import { MessagesPanel } from "@/components/MessagesPanel";
import { requireUser } from "@/lib/auth";
import { getThreadPreviews } from "@/lib/messages";

export default async function FreelancerMessagesPage() {
  const user = await requireUser(["freelancer"]);
  const threads = await getThreadPreviews(user.id);
  return (
    <MessagesPanel
      threads={threads}
      messages={[]}
      basePath="/freelancer/messages"
      currentUserId={user.id}
    />
  );
}

import { MessagesPanel } from "@/components/MessagesPanel";
import { requireUser } from "@/lib/auth";
import { getThreadPreviews } from "@/lib/messages";
import { getMessages, markThreadRead } from "@/lib/store";
import { notFound } from "next/navigation";

export default async function FreelancerThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser(["freelancer"]);
  const { id } = await params;
  await markThreadRead(user.id, id).catch(() => undefined);
  const threads = await getThreadPreviews(user.id);
  const active = threads.find((t) => t.id === id);
  if (!active) notFound();
  const messages = await getMessages(id);
  return (
    <MessagesPanel
      threads={threads}
      active={active}
      messages={messages}
      basePath="/freelancer/messages"
      currentUserId={user.id}
    />
  );
}

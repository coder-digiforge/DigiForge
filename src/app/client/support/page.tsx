import { SupportPanel } from "@/components/SupportPanel";
import { requireUser } from "@/lib/auth";

export default async function ClientSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const user = await requireUser(["client"]);
  const { sent, error } = await searchParams;

  return (
    <SupportPanel
      email={user.email}
      returnTo="/client/support"
      notice={sent ? "Запрос отправлен. Ответим на email в рабочие часы CET." : undefined}
      error={error}
    />
  );
}

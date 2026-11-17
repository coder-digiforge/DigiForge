import { SupportPanel } from "@/components/SupportPanel";
import { requireUser } from "@/lib/auth";

export default async function FreelancerSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const user = await requireUser(["freelancer"]);
  const { sent, error } = await searchParams;

  return (
    <SupportPanel
      email={user.email}
      returnTo="/freelancer/support"
      notice={sent ? "Запрос отправлен. Ответим на email в рабочие часы CET." : undefined}
      error={error}
    />
  );
}

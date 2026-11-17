import { SupportPanel } from "@/components/SupportPanel";
import { getSessionUser, keepCabinetShell } from "@/lib/auth";

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  await keepCabinetShell({
    client: "/client/support",
    freelancer: "/freelancer/support",
  });
  const user = await getSessionUser();
  const { sent, error } = await searchParams;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 md:px-12 md:py-16">
      <SupportPanel
        email={user?.email}
        returnTo="/support"
        notice={sent ? "Запрос отправлен. Ответим на email в рабочие часы CET." : undefined}
        error={error}
      />
    </div>
  );
}

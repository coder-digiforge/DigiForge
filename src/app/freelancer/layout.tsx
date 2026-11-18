import { AppHeader } from "@/components/AppHeader";
import { FreelancerMobileNav } from "@/components/CabinetMobileNav";
import { FreelancerSidebar } from "@/components/Sidebar";
import type { TaskPreview } from "@/components/TasksMenu";
import { ThemeShell } from "@/components/ThemeShell";
import { requireUser } from "@/lib/auth";
import { getDb, listDealsForUser, listNotifications } from "@/lib/store";

export const dynamic = "force-dynamic";

const ACTIVE = new Set(["funded", "in_progress", "delivered", "disputed"]);

const STATUS_LABEL: Record<string, string> = {
  funded: "Оплачено",
  in_progress: "В работе",
  delivered: "Сдано",
  disputed: "Диспут",
};

export default async function FreelancerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["freelancer"]);
  const deals = (await listDealsForUser(user.id)).filter(
    (d) => d.freelancerId === user.id && ACTIVE.has(d.status),
  );
  const db = await getDb();
  const notifications = (await listNotifications(user.id)).slice(0, 12);

  const tasks: TaskPreview[] = deals.map((d) => {
    const project = db.projects.find((p) => p.id === d.projectId);
    return {
      id: d.id,
      title: project?.title ?? "Задача",
      amount: d.amount,
      status: d.status,
      statusLabel: STATUS_LABEL[d.status] ?? d.status,
    };
  });

  return (
    <ThemeShell className="flex min-h-dvh flex-col bg-bg-deep text-text">
      <AppHeader
        user={user}
        variant="freelancer"
        tasks={tasks}
        notifications={notifications}
      />
      <div className="mx-auto flex w-full max-w-[1440px] min-h-0 flex-1 flex-col gap-6 px-4 py-4 pb-24 sm:px-6 sm:py-6 lg:flex-row lg:px-10 lg:pb-6">
        <FreelancerSidebar />
        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden">{children}</div>
      </div>
      <FreelancerMobileNav />
    </ThemeShell>
  );
}

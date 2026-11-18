import { AppHeader } from "@/components/AppHeader";
import { ClientMobileNav } from "@/components/CabinetMobileNav";
import { ClientSidebar } from "@/components/Sidebar";
import { ThemeShell } from "@/components/ThemeShell";
import { requireUser } from "@/lib/auth";
import { listNotifications } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["client"]);
  const notifications = (await listNotifications(user.id)).slice(0, 12);
  return (
    <ThemeShell className="min-h-screen bg-bg-deep text-text">
      <AppHeader user={user} variant="client" notifications={notifications} />
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-4 pb-24 sm:px-6 sm:py-6 lg:flex-row lg:px-10 lg:pb-6">
        <ClientSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      <ClientMobileNav />
    </ThemeShell>
  );
}

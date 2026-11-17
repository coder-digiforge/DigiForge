import { AdminSidebar } from "@/components/Sidebar";
import { Logo } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["admin"]);
  return (
    <div className="min-h-screen bg-bg-deep">
      <header className="border-b border-border bg-panel/90 px-6 py-4 md:px-10">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo href="/admin" />
            <span className="hidden rounded-full border border-[rgba(224,168,107,0.35)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent sm:inline">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted">{user.name}</span>
            <form action={logoutAction}>
              <button className="text-accent hover:underline" type="submit">
                Выйти
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-6 py-6 md:flex-row md:px-10">
        <AdminSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

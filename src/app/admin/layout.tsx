import { AdminMobileNav } from "@/components/CabinetMobileNav";
import { AdminSidebar } from "@/components/Sidebar";
import { Logo } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["admin"]);
  return (
    <div className="min-h-screen bg-bg-deep pb-24 lg:pb-0">
      <header className="sticky top-0 z-40 border-b border-border bg-panel/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 md:h-auto md:px-10 md:py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo href="/admin" compact />
            <span className="rounded-full border border-[rgba(224,168,107,0.35)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent sm:px-2.5 sm:text-[11px]">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden max-w-[140px] truncate text-muted sm:inline">{user.name}</span>
            <form action={logoutAction}>
              <button className="text-accent hover:underline" type="submit">
                Выйти
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:flex-row lg:px-10">
        <AdminSidebar />
        <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
          {children}
        </div>
      </div>
      <AdminMobileNav />
    </div>
  );
}

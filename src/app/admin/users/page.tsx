import Link from "next/link";
import { Chip, EmptyState, PageTitle, Panel } from "@/components/ui";
import { formatUsdt, roleLabel, timeAgo } from "@/lib/admin-labels";
import { requireUser } from "@/lib/auth";
import { calcBalances, listAllForAdmin } from "@/lib/store";
import type { Role } from "@/lib/types";

type SearchParams = Promise<{ q?: string; role?: string; status?: string }>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireUser(["admin"]);
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const role = (sp.role ?? "all") as Role | "all";
  const status = sp.status ?? "all";

  const db = await listAllForAdmin();
  let users = db.users.filter((u) => u.role !== "admin");

  if (role !== "all") users = users.filter((u) => u.role === role);
  if (status === "active") users = users.filter((u) => !u.deactivatedAt);
  if (status === "off") users = users.filter((u) => !!u.deactivatedAt);
  if (q) {
    users = users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q),
    );
  }

  users = [...users].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const filters = [
    { key: "role", value: "all", label: "Все роли" },
    { key: "role", value: "client", label: "Заказчики" },
    { key: "role", value: "freelancer", label: "Фрилансеры" },
  ] as const;

  const statusFilters = [
    { value: "all", label: "Все" },
    { value: "active", label: "Активные" },
    { value: "off", label: "Откл." },
  ] as const;

  function href(next: { q?: string; role?: string; status?: string }) {
    const params = new URLSearchParams();
    const qq = next.q ?? sp.q;
    const rr = next.role ?? sp.role;
    const ss = next.status ?? sp.status;
    if (qq) params.set("q", qq);
    if (rr && rr !== "all") params.set("role", rr);
    if (ss && ss !== "all") params.set("status", ss);
    const s = params.toString();
    return s ? `/admin/users?${s}` : "/admin/users";
  }

  return (
    <Panel className="p-6 md:p-8">
      <PageTitle title="Пользователи" subtitle={`${users.length} в выборке`} />

      <form className="mb-4 flex flex-wrap gap-2" action="/admin/users" method="get">
        {role !== "all" && <input type="hidden" name="role" value={role} />}
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Имя, email или id…"
          className="df-input min-w-[220px] flex-1"
        />
        <button
          type="submit"
          className="df-btn df-btn-primary rounded-xl px-4 py-2 text-sm font-semibold"
        >
          Найти
        </button>
      </form>

      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = role === f.value || (f.value === "all" && role === "all");
          return (
            <Link
              key={f.value}
              href={href({ role: f.value })}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                active
                  ? "border-accent bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-accent"
                  : "border-border text-muted hover:text-text"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
        <span className="mx-1 hidden text-border sm:inline">|</span>
        {statusFilters.map((f) => {
          const active = status === f.value;
          return (
            <Link
              key={f.value}
              href={href({ status: f.value })}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                active
                  ? "border-accent bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-accent"
                  : "border-border text-muted hover:text-text"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {users.length === 0 ? (
        <EmptyState title="Никого не найдено" hint="Сбросьте фильтры или измените запрос" />
      ) : (
        <div className="space-y-2">
          {users.map((u) => {
            const bal = calcBalances(db, u.id);
            return (
              <Link
                key={u.id}
                href={`/admin/users/${u.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 transition hover:border-accent/40"
              >
                <div className="min-w-0">
                  <div className="font-semibold">
                    {u.name}
                    {u.deactivatedAt ? (
                      <span className="ml-2 text-xs font-medium text-[#e07a5f]">отключён</span>
                    ) : null}
                  </div>
                  <div className="truncate text-sm text-muted">
                    {u.email} · {u.id} · {timeAgo(u.createdAt)}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted">{formatUsdt(bal.available)}</span>
                  <Chip>{roleLabel[u.role]}</Chip>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

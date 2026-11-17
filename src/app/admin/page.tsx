import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownToLine,
  Briefcase,
  Landmark,
  ShieldAlert,
  Users,
} from "lucide-react";
import { Chip, PageTitle, Panel, StatCard } from "@/components/ui";
import {
  dealStatusLabel,
  formatUsdt,
  projectStatusLabel,
  roleLabel,
  timeAgo,
} from "@/lib/admin-labels";
import { requireUser } from "@/lib/auth";
import { listAllForAdmin } from "@/lib/store";

export default async function AdminHomePage() {
  await requireUser(["admin"]);
  const db = await listAllForAdmin();

  const disputed = db.deals.filter((d) => d.status === "disputed");
  const pendingWd = db.withdrawals.filter((w) => w.status === "pending");
  const openProjects = db.projects.filter((p) => p.status === "open").length;
  const activeUsers = db.users.filter((u) => !u.deactivatedAt && u.role !== "admin").length;

  const escrowLocked = db.deals
    .filter((d) => ["funded", "in_progress", "delivered", "disputed"].includes(d.status))
    .reduce((s, d) => s + d.amount, 0);

  const fees = db.ledger
    .filter((l) => l.kind === "fee")
    .reduce((s, l) => s + Math.abs(l.amount), 0);

  const volumeReleased = db.ledger
    .filter((l) => l.kind === "escrow_release" && l.amount > 0)
    .reduce((s, l) => s + l.amount, 0);

  type Activity = { id: string; title: string; body: string; at: string; href: string };
  const activity: Activity[] = [
    ...disputed.map((d) => {
      const project = db.projects.find((p) => p.id === d.projectId);
      return {
        id: `dispute-${d.id}`,
        title: "Диспут",
        body: project?.title ?? d.id,
        at: d.deliveredAt ?? d.createdAt,
        href: "/admin/deals?status=disputed",
      };
    }),
    ...pendingWd.map((w) => {
      const user = db.users.find((u) => u.id === w.userId);
      return {
        id: `wd-${w.id}`,
        title: "Вывод ожидает",
        body: `${user?.name ?? w.userId} · ${formatUsdt(w.amount)}`,
        at: w.createdAt,
        href: "/admin/finance",
      };
    }),
    ...db.projects
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 4)
      .map((p) => ({
        id: `proj-${p.id}`,
        title: "Проект",
        body: `${p.title} · ${projectStatusLabel[p.status]}`,
        at: p.createdAt,
        href: "/admin/projects",
      })),
    ...db.reviews
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 3)
      .map((r) => {
        const to = db.users.find((u) => u.id === r.toUserId);
        return {
          id: `rev-${r.id}`,
          title: "Отзыв",
          body: `${to?.name ?? r.toUserId} · ${r.rating}/5`,
          at: r.createdAt,
          href: "/admin/reviews",
        };
      }),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 10);

  const recentUsers = [...db.users]
    .filter((u) => u.role !== "admin")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <Panel className="p-6 md:p-8">
        <PageTitle
          title="Обзор"
          subtitle="Контроль биржи: эскроу, пользователи, выводы и диспуты"
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Активные пользователи" value={String(activeUsers)} hint={`Всего ${db.users.length}`} />
          <StatCard label="Открытые проекты" value={String(openProjects)} hint={`Всего ${db.projects.length}`} />
          <StatCard label="В эскроу" value={formatUsdt(escrowLocked)} hint={`${db.deals.length} сделок`} />
          <StatCard
            label="Комиссии"
            value={formatUsdt(fees)}
            hint={`Выплаты: ${formatUsdt(volumeReleased)}`}
          />
        </div>
      </Panel>

      {(disputed.length > 0 || pendingWd.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {disputed.length > 0 && (
            <Panel className="border-[color-mix(in_srgb,#e07a5f_35%,var(--border))] p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-[color-mix(in_srgb,#e07a5f_18%,transparent)] p-2.5 text-[#e07a5f]">
                  <ShieldAlert size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-text">Диспуты: {disputed.length}</div>
                  <p className="mt-1 text-sm text-muted">
                    Требуют решения: выплата фрилансеру или возврат клиенту
                  </p>
                  <Link
                    href="/admin/deals?status=disputed"
                    className="mt-3 inline-flex text-sm font-medium text-accent hover:underline"
                  >
                    Открыть очередь →
                  </Link>
                </div>
              </div>
            </Panel>
          )}
          {pendingWd.length > 0 && (
            <Panel className="border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] p-2.5 text-accent">
                  <ArrowDownToLine size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-text">
                    Выводы: {pendingWd.length}
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    Заявки на вывод USDT ждут approve / reject
                  </p>
                  <Link
                    href="/admin/finance"
                    className="mt-3 inline-flex text-sm font-medium text-accent hover:underline"
                  >
                    К финансам →
                  </Link>
                </div>
              </div>
            </Panel>
          )}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <Panel className="p-6 md:p-8">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-accent" />
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
              Лента событий
            </h2>
          </div>
          {activity.length === 0 ? (
            <p className="text-sm text-muted">Пока тихо</p>
          ) : (
            <ul className="divide-y divide-border">
              {activity.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 transition hover:text-accent"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-text">{item.title}</div>
                      <div className="truncate text-sm text-muted">{item.body}</div>
                    </div>
                    <span className="shrink-0 text-xs text-muted">{timeAgo(item.at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Users size={16} className="text-accent" />
              <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                Новые пользователи
              </h2>
            </div>
            <ul className="space-y-3">
              {recentUsers.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2.5 transition hover:border-accent/40"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{u.name}</div>
                      <div className="truncate text-xs text-muted">{u.email}</div>
                    </div>
                    <Chip>{roleLabel[u.role]}</Chip>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/admin/users"
              className="mt-4 inline-flex text-sm font-medium text-accent hover:underline"
            >
              Все пользователи →
            </Link>
          </Panel>

          <Panel className="p-6">
            <div className="mb-3 flex items-center gap-2">
              <Landmark size={16} className="text-accent" />
              <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                Быстрые ссылки
              </h2>
            </div>
            <div className="grid gap-2">
              <Link
                href="/admin/deals"
                className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm hover:border-accent/40"
              >
                <Briefcase size={15} className="text-accent" /> Сделки и диспуты
              </Link>
              <Link
                href="/admin/finance"
                className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm hover:border-accent/40"
              >
                <ArrowDownToLine size={15} className="text-accent" /> Депозиты и выводы
              </Link>
              <Link
                href="/admin/projects"
                className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm hover:border-accent/40"
              >
                <Briefcase size={15} className="text-accent" /> Модерация проектов
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

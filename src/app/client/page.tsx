import Link from "next/link";
import {
  Briefcase,
  FolderKanban,
  Lock,
  Search,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react";
import { ButtonLink, PageTitle, Panel } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import {
  getBalances,
  getDb,
  listDealsForUser,
  listNotifications,
  listProjects,
} from "@/lib/store";
import type { EscrowStatus, ProjectStatus } from "@/lib/types";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.floor(diff / 60000));
  if (mins < 60) return `${mins} мин. назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч. назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн. назад`;
}

const projectStatusLabel: Record<ProjectStatus, string> = {
  open: "Открыт",
  in_progress: "В работе",
  delivered: "Сдан",
  completed: "Завершён",
  disputed: "Диспут",
  cancelled: "Отменён",
};

const dealStatusLabel: Record<EscrowStatus, string> = {
  pending_funding: "Ожидает оплату",
  funded: "В сейфе",
  in_progress: "В работе",
  delivered: "На приёмке",
  released: "Выплачен",
  disputed: "Диспут",
  refunded: "Возврат",
};

export default async function ClientOverviewPage() {
  const user = await requireUser(["client"]);
  const db = await getDb();
  const projects = (await listProjects()).filter((p) => p.clientId === user.id);
  const deals = (await listDealsForUser(user.id)).filter((d) => d.clientId === user.id);
  const activeDeals = deals.filter((d) =>
    ["pending_funding", "funded", "in_progress", "delivered", "disputed"].includes(d.status),
  );
  const openProjects = projects.filter((p) => p.status === "open");
  const bal = await getBalances(user.id);
  const notes = (await listNotifications(user.id)).slice(0, 8);
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const activeDealRows = activeDeals.slice(0, 4).map((d) => {
    const project = db.projects.find((p) => p.id === d.projectId);
    const freelancer = db.users.find((u) => u.id === d.freelancerId);
    return { deal: d, project, freelancer };
  });

  return (
    <div className="space-y-6">
      <Panel className="p-6 md:p-8">
        <PageTitle
          title="Обзор"
          subtitle={`Привет, ${user.name}`}
          action={<ButtonLink href="/client/projects/new">+ Новый проект</ButtonLink>}
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.9fr)]">
          {/* Left column */}
          <div className="space-y-5">
            <section className="relative overflow-hidden rounded-2xl border border-border bg-[linear-gradient(135deg,#2a2118_0%,#1a1511_55%,#14100d_100%)] p-6 md:p-7">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(224,168,107,0.28),transparent_70%)]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(224,168,107,0.12),transparent_70%)]"
              />
              <div className="relative max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(224,168,107,0.3)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] px-3 py-1 text-xs font-semibold text-accent">
                  <ShieldCheck size={14} />
                  Эскроу · USDT
                </div>
                <h2 className="mt-4 font-[family-name:var(--font-syne)] text-2xl font-bold leading-snug text-text md:text-[1.7rem]">
                  Наймите исполнителя — оплата только после приёмки
                </h2>
                <p className="mt-3 max-w-[42ch] text-sm leading-relaxed text-muted">
                  Бюджет в сейфе DigiForge до сдачи работы. Без предоплаты «на слово» и скрытых
                  комиссий — только 10% с сделки.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <ButtonLink
                    href="/client/projects/new"
                    className="!rounded-full !px-5 !py-2.5 !text-sm"
                  >
                    Опубликовать проект
                  </ButtonLink>
                  <ButtonLink
                    href="/client/freelancers"
                    variant="ghost"
                    className="!rounded-full !px-5 !py-2.5 !text-sm"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Search size={14} />
                      Смотреть исполнителей
                    </span>
                  </ButtonLink>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-panel p-5 md:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-text">
                  Лента
                </h2>
                <Link href="/client/projects" className="text-xs text-accent hover:underline">
                  К проектам
                </Link>
              </div>
              {notes.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">
                  Пока тихо — опубликуйте проект или найдите исполнителя
                </p>
              ) : (
                <ul className="space-y-1">
                  {notes.map((n) => (
                    <li key={n.id}>
                      <Link
                        href={n.href ?? "/client"}
                        className="flex items-start gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
                      >
                        <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-panel-soft text-xs font-semibold text-accent">
                          {(n.initials ?? n.title).slice(0, 2)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] text-muted">{timeAgo(n.createdAt)}</div>
                          <div className="mt-0.5 text-sm text-text">
                            <span className="font-semibold">{n.title}</span>
                            <span className="text-muted"> — {n.body}</span>
                          </div>
                        </div>
                        {!n.read && (
                          <span
                            className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent"
                            aria-label="Непрочитано"
                          />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-panel p-5 md:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-text">
                  Активные сделки
                </h2>
                <Link href="/client/work" className="text-xs text-accent hover:underline">
                  Все в работе
                </Link>
              </div>
              {activeDealRows.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">
                  Нет активных эскроу — выберите ставку в проекте
                </p>
              ) : (
                <ul className="space-y-2">
                  {activeDealRows.map(({ deal, project, freelancer }) => (
                    <li key={deal.id}>
                      <Link
                        href={`/client/projects/${deal.projectId}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 transition-colors hover:border-accent/40"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-text">
                            {project?.title ?? "Проект"}
                          </div>
                          <div className="mt-0.5 truncate text-xs text-muted">
                            {freelancer?.name ?? "Исполнитель"} · {deal.amount} USDT
                          </div>
                        </div>
                        <span className="shrink-0 rounded-full border border-border bg-panel-soft px-2.5 py-1 text-[11px] font-medium text-accent">
                          {dealStatusLabel[deal.status]}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            <section className="rounded-2xl border border-border bg-panel p-5">
              <h2 className="mb-4 font-[family-name:var(--font-syne)] text-lg font-semibold text-text">
                Мои показатели
              </h2>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-panel-soft/80 px-2 py-4">
                  <FolderKanban className="mx-auto text-accent" size={18} />
                  <div className="mt-2 font-[family-name:var(--font-syne)] text-xl font-bold text-text">
                    {projects.length}
                  </div>
                  <div className="mt-1 text-[11px] text-muted">Проекты</div>
                </div>
                <div className="rounded-xl bg-panel-soft/80 px-2 py-4">
                  <Star className="mx-auto text-accent" size={18} />
                  <div className="mt-2 font-[family-name:var(--font-syne)] text-xl font-bold text-text">
                    {user.rating.toFixed(1)}
                  </div>
                  <div className="mt-1 text-[11px] text-muted">Рейтинг</div>
                </div>
                <div className="rounded-xl bg-panel-soft/80 px-2 py-4">
                  <Wallet className="mx-auto text-accent" size={18} />
                  <div className="mt-2 font-[family-name:var(--font-syne)] text-xl font-bold text-text">
                    {bal.available}
                  </div>
                  <div className="mt-1 text-[11px] text-muted">USDT</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted">
                <div className="rounded-lg border border-border px-3 py-2">
                  Открытых: <span className="text-text">{openProjects.length}</span>
                </div>
                <div className="rounded-lg border border-border px-3 py-2">
                  В работе: <span className="text-text">{activeDeals.length}</span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-panel p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-text">
                  Финансы
                </h2>
                <Link href="/client/finance" className="text-xs text-accent hover:underline">
                  Подробнее
                </Link>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 rounded-xl bg-panel-soft/80 px-4 py-3">
                  <div className="flex items-center gap-2.5 text-sm text-muted">
                    <Wallet size={16} className="text-accent" />
                    Доступно
                  </div>
                  <span className="font-[family-name:var(--font-syne)] text-base font-bold text-text">
                    {bal.available} USDT
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-xl bg-panel-soft/80 px-4 py-3">
                  <div className="flex items-center gap-2.5 text-sm text-muted">
                    <Lock size={16} className="text-accent" />
                    В сейфе
                  </div>
                  <span className="font-[family-name:var(--font-syne)] text-base font-bold text-text">
                    {bal.escrow} USDT
                  </span>
                </div>
              </div>
              <ButtonLink
                href="/client/finance"
                variant="ghost"
                className="mt-4 !w-full !rounded-full !py-2.5 !text-sm"
              >
                Пополнить баланс
              </ButtonLink>
            </section>

            <section className="rounded-2xl border border-border bg-panel p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-text">
                  Мои проекты
                </h2>
                <Link href="/client/projects" className="text-xs text-accent hover:underline">
                  Все
                </Link>
              </div>
              {recentProjects.length === 0 ? (
                <Link
                  href="/client/projects/new"
                  className="block rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted hover:border-accent/40 hover:text-accent"
                >
                  Создайте первый заказ
                </Link>
              ) : (
                <ul className="space-y-2">
                  {recentProjects.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/client/projects/${p.id}`}
                        className="flex items-start justify-between gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Briefcase size={14} className="shrink-0 text-accent" />
                            <span className="truncate text-sm font-medium text-text">{p.title}</span>
                          </div>
                          <div className="mt-1 pl-6 text-[11px] text-muted">
                            {p.budgetMin}–{p.budgetMax} USDT · {p.category}
                          </div>
                        </div>
                        <span className="shrink-0 text-[11px] text-muted">
                          {projectStatusLabel[p.status]}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </Panel>
    </div>
  );
}

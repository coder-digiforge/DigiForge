import Link from "next/link";
import { notFound } from "next/navigation";
import { adminSetUserActiveAction } from "@/app/actions/admin";
import { Button, Chip, PageTitle, Panel, StatCard } from "@/components/ui";
import {
  dealStatusLabel,
  formatUsdt,
  roleLabel,
  timeAgo,
} from "@/lib/admin-labels";
import { requireUser } from "@/lib/auth";
import { calcBalances, listAllForAdmin } from "@/lib/store";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser(["admin"]);
  const { id } = await params;
  const db = await listAllForAdmin();
  const user = db.users.find((u) => u.id === id);
  if (!user || user.role === "admin") notFound();

  const bal = calcBalances(db, user.id);
  const deals = db.deals.filter(
    (d) => d.clientId === user.id || d.freelancerId === user.id,
  );
  const projects =
    user.role === "client"
      ? db.projects.filter((p) => p.clientId === user.id)
      : db.projects.filter((p) =>
          deals.some((d) => d.projectId === p.id && d.freelancerId === user.id),
        );
  const reviews = db.reviews.filter(
    (r) => r.toUserId === user.id || r.fromUserId === user.id,
  );
  const ledger = db.ledger
    .filter((l) => l.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <Panel className="p-6 md:p-8">
        <PageTitle
          title={user.name}
          subtitle={`${user.email} · ${user.id}`}
          action={
            <Link href="/admin/users" className="text-sm text-accent hover:underline">
              ← К списку
            </Link>
          }
        />

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Chip>{roleLabel[user.role]}</Chip>
          {user.deactivatedAt ? (
            <Chip>Отключён · {timeAgo(user.deactivatedAt)}</Chip>
          ) : (
            <Chip>Активен</Chip>
          )}
          {user.digiPrimeUntil && new Date(user.digiPrimeUntil) > new Date() ? (
            <Chip>Digi Prime</Chip>
          ) : null}
          {user.twoFaEnabled ? <Chip>2FA</Chip> : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Доступно" value={formatUsdt(bal.available)} />
          <StatCard label="В эскроу" value={formatUsdt(bal.escrow)} />
          <StatCard label="Сделки" value={String(deals.length)} />
          <StatCard
            label="Рейтинг"
            value={user.reviewCount ? String(user.rating) : "—"}
            hint={`${user.reviewCount} отзывов`}
          />
        </div>

        <form action={adminSetUserActiveAction} className="mt-6">
          <input type="hidden" name="userId" value={user.id} />
          <input
            type="hidden"
            name="active"
            value={user.deactivatedAt ? "1" : "0"}
          />
          <Button type="submit" variant={user.deactivatedAt ? "primary" : "ghost"}>
            {user.deactivatedAt ? "Реактивировать" : "Деактивировать аккаунт"}
          </Button>
        </form>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel className="p-6">
          <h2 className="mb-4 font-[family-name:var(--font-syne)] text-lg font-bold">
            Сделки
          </h2>
          {deals.length === 0 ? (
            <p className="text-sm text-muted">Нет сделок</p>
          ) : (
            <ul className="space-y-2">
              {deals.map((d) => {
                const project = db.projects.find((p) => p.id === d.projectId);
                return (
                  <li
                    key={d.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {project?.title ?? d.projectId}
                      </div>
                      <div className="text-xs text-muted">{formatUsdt(d.amount)}</div>
                    </div>
                    <Chip>{dealStatusLabel[d.status]}</Chip>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel className="p-6">
          <h2 className="mb-4 font-[family-name:var(--font-syne)] text-lg font-bold">
            Проекты
          </h2>
          {projects.length === 0 ? (
            <p className="text-sm text-muted">Нет проектов</p>
          ) : (
            <ul className="space-y-2">
              {projects.slice(0, 8).map((p) => (
                <li
                  key={p.id}
                  className="rounded-xl border border-border px-3 py-2.5 text-sm"
                >
                  <div className="font-semibold">{p.title}</div>
                  <div className="text-xs text-muted">
                    {p.budget != null && p.budget > 0
                      ? `${p.budget} USDT`
                      : "Не указан"}{" "}
                    · {p.status}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="p-6">
          <h2 className="mb-4 font-[family-name:var(--font-syne)] text-lg font-bold">
            Ledger
          </h2>
          {ledger.length === 0 ? (
            <p className="text-sm text-muted">Пусто</p>
          ) : (
            <ul className="space-y-2">
              {ledger.map((l) => (
                <li
                  key={l.id}
                  className="flex justify-between gap-2 rounded-xl border border-border px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate text-muted">{l.note}</span>
                  <span className={l.amount >= 0 ? "text-accent" : "text-[#e07a5f]"}>
                    {l.amount >= 0 ? "+" : ""}
                    {l.amount}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel className="p-6">
          <h2 className="mb-4 font-[family-name:var(--font-syne)] text-lg font-bold">
            Отзывы
          </h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted">Нет отзывов</p>
          ) : (
            <ul className="space-y-2">
              {reviews.slice(0, 6).map((r) => (
                <li key={r.id} className="rounded-xl border border-border px-3 py-2.5 text-sm">
                  <div className="font-semibold">{r.rating}/5</div>
                  <p className="mt-1 text-muted">{r.text}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

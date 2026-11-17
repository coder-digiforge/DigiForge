import Link from "next/link";
import { adminProcessWithdrawalAction } from "@/app/actions/admin";
import { Button, Chip, EmptyState, PageTitle, Panel, StatCard } from "@/components/ui";
import {
  depositStatusLabel,
  formatUsdt,
  ledgerKindLabel,
  timeAgo,
  withdrawalStatusLabel,
} from "@/lib/admin-labels";
import { requireUser } from "@/lib/auth";
import { listAllForAdmin } from "@/lib/store";

export default async function AdminFinancePage() {
  await requireUser(["admin"]);
  const db = await listAllForAdmin();

  const pendingWd = db.withdrawals.filter((w) => w.status === "pending");
  const completedDeposits = db.deposits.filter((d) => d.status === "completed");
  const depositSum = completedDeposits.reduce((s, d) => s + d.amount, 0);
  const fees = db.ledger
    .filter((l) => l.kind === "fee")
    .reduce((s, l) => s + Math.abs(l.amount), 0);
  const withdrawDone = db.withdrawals
    .filter((w) => w.status === "completed")
    .reduce((s, w) => s + w.amount, 0);

  const ledger = [...db.ledger]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 24);

  const withdrawals = [...db.withdrawals].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const deposits = [...db.deposits].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  return (
    <div className="space-y-6">
      <Panel className="p-6 md:p-8">
        <PageTitle
          title="Финансы"
          subtitle="Депозиты, выводы и журнал ledger"
        />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Депозиты" value={formatUsdt(depositSum)} />
          <StatCard label="Выводы выполнены" value={formatUsdt(withdrawDone)} />
          <StatCard label="Ожидают вывода" value={String(pendingWd.length)} />
          <StatCard label="Комиссии" value={formatUsdt(fees)} />
        </div>
      </Panel>

      <Panel className="p-6 md:p-8">
        <h2 className="mb-4 font-[family-name:var(--font-syne)] text-lg font-bold">
          Выводы
        </h2>
        {withdrawals.length === 0 ? (
          <EmptyState title="Заявок пока нет" />
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => {
              const user = db.users.find((u) => u.id === w.userId);
              return (
                <div
                  key={w.id}
                  className={`rounded-xl border p-4 ${
                    w.status === "pending"
                      ? "border-[color-mix(in_srgb,var(--accent)_35%,var(--border))]"
                      : "border-border"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold">
                        {formatUsdt(w.amount)} · {w.network}
                      </div>
                      <div className="mt-1 text-sm text-muted">
                        <Link
                          href={`/admin/users/${w.userId}`}
                          className="text-accent hover:underline"
                        >
                          {user?.name ?? w.userId}
                        </Link>
                        {" · "}
                        <span className="break-all">{w.address}</span>
                        {" · "}
                        {timeAgo(w.createdAt)}
                      </div>
                    </div>
                    <Chip>{withdrawalStatusLabel[w.status]}</Chip>
                  </div>
                  {w.status === "pending" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <form action={adminProcessWithdrawalAction}>
                        <input type="hidden" name="withdrawalId" value={w.id} />
                        <input type="hidden" name="decision" value="approve" />
                        <Button type="submit">Одобрить</Button>
                      </form>
                      <form action={adminProcessWithdrawalAction}>
                        <input type="hidden" name="withdrawalId" value={w.id} />
                        <input type="hidden" name="decision" value="reject" />
                        <Button type="submit" variant="ghost">
                          Отклонить
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel className="p-6 md:p-8">
        <h2 className="mb-4 font-[family-name:var(--font-syne)] text-lg font-bold">
          Депозиты
        </h2>
        {deposits.length === 0 ? (
          <EmptyState title="Депозитов пока нет" />
        ) : (
          <div className="space-y-2">
            {deposits.map((d) => {
              const user = db.users.find((u) => u.id === d.userId);
              return (
                <div
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="font-semibold">
                      {formatUsdt(d.amount)} · {d.network}
                    </div>
                    <div className="text-sm text-muted">
                      <Link
                        href={`/admin/users/${d.userId}`}
                        className="text-accent hover:underline"
                      >
                        {user?.name ?? d.userId}
                      </Link>
                      {" · "}
                      {timeAgo(d.createdAt)}
                    </div>
                  </div>
                  <Chip>{depositStatusLabel[d.status]}</Chip>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel className="p-6 md:p-8">
        <h2 className="mb-4 font-[family-name:var(--font-syne)] text-lg font-bold">
          Ledger
        </h2>
        <div className="space-y-2">
          {ledger.map((l) => {
            const user = db.users.find((u) => u.id === l.userId);
            return (
              <div
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-semibold">
                    {ledgerKindLabel[l.kind]} · {user?.name ?? l.userId}
                  </div>
                  <div className="truncate text-muted">{l.note}</div>
                </div>
                <div className="text-right">
                  <div
                    className={
                      l.amount >= 0 ? "font-semibold text-accent" : "font-semibold text-[#e07a5f]"
                    }
                  >
                    {l.amount >= 0 ? "+" : ""}
                    {l.amount} {l.asset}
                  </div>
                  <div className="text-xs text-muted">{timeAgo(l.createdAt)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

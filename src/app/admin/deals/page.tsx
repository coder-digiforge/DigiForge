import Link from "next/link";
import { adminResolveAction } from "@/app/actions/admin";
import { Button, Chip, EmptyState, PageTitle, Panel } from "@/components/ui";
import { dealStatusLabel, formatUsdt, timeAgo } from "@/lib/admin-labels";
import { requireUser } from "@/lib/auth";
import { listAllForAdmin } from "@/lib/store";
import type { EscrowStatus } from "@/lib/types";

type SearchParams = Promise<{ status?: string }>;

export default async function AdminDealsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireUser(["admin"]);
  const sp = await searchParams;
  const status = (sp.status ?? "all") as EscrowStatus | "all";
  const db = await listAllForAdmin();

  let deals = [...db.deals].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (status !== "all") deals = deals.filter((d) => d.status === status);

  const tabs: Array<EscrowStatus | "all"> = [
    "all",
    "disputed",
    "in_progress",
    "delivered",
    "funded",
    "released",
    "refunded",
  ];

  return (
    <Panel className="p-6 md:p-8">
      <PageTitle title="Сделки" subtitle="Эскроу, приёмка и диспуты" />

      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((s) => {
          const active = status === s;
          const label = s === "all" ? "Все" : dealStatusLabel[s];
          const href =
            s === "all" ? "/admin/deals" : `/admin/deals?status=${s}`;
          return (
            <Link
              key={s}
              href={href}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                active
                  ? "border-accent bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-accent"
                  : "border-border text-muted hover:text-text"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {deals.length === 0 ? (
        <EmptyState title="Сделок нет" />
      ) : (
        <div className="space-y-3">
          {deals.map((d) => {
            const project = db.projects.find((p) => p.id === d.projectId);
            const client = db.users.find((u) => u.id === d.clientId);
            const freelancer = db.users.find((u) => u.id === d.freelancerId);
            const fee = Number(((d.amount * d.feePercent) / 100).toFixed(2));
            return (
              <div
                key={d.id}
                className={`rounded-xl border p-4 ${
                  d.status === "disputed"
                    ? "border-[color-mix(in_srgb,#e07a5f_40%,var(--border))]"
                    : "border-border"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold">{project?.title ?? d.projectId}</div>
                    <div className="mt-1 text-sm text-muted">
                      {formatUsdt(d.amount)} · fee {d.feePercent}% ({formatUsdt(fee)}) ·{" "}
                      {timeAgo(d.createdAt)}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <span>
                        Заказчик:{" "}
                        <Link
                          href={`/admin/users/${d.clientId}`}
                          className="text-accent hover:underline"
                        >
                          {client?.name ?? d.clientId}
                        </Link>
                      </span>
                      <span>
                        Исполнитель:{" "}
                        <Link
                          href={`/admin/users/${d.freelancerId}`}
                          className="text-accent hover:underline"
                        >
                          {freelancer?.name ?? d.freelancerId}
                        </Link>
                      </span>
                    </div>
                  </div>
                  <Chip>{dealStatusLabel[d.status]}</Chip>
                </div>

                {d.status === "disputed" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <form action={adminResolveAction}>
                      <input type="hidden" name="dealId" value={d.id} />
                      <input type="hidden" name="resolution" value="release" />
                      <Button type="submit">Выплатить фрилансеру</Button>
                    </form>
                    <form action={adminResolveAction}>
                      <input type="hidden" name="dealId" value={d.id} />
                      <input type="hidden" name="resolution" value="refund" />
                      <Button type="submit" variant="ghost">
                        Вернуть клиенту
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
  );
}

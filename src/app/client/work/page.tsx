import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Lock,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import {
  disputeDealAction,
  fundDealAction,
  releaseDealAction,
} from "@/app/actions/marketplace";
import { ReviewForm } from "@/components/ReviewForm";
import { UserAvatar } from "@/components/UserAvatar";
import { Button, ButtonLink, EmptyState, PageTitle, Panel } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getDb, listDealsForUser } from "@/lib/store";
import type { EscrowStatus } from "@/lib/types";

const statusMeta: Record<
  EscrowStatus,
  { label: string; tone: "accent" | "success" | "danger" | "muted" }
> = {
  pending_funding: { label: "Ожидает оплату", tone: "muted" },
  funded: { label: "В сейфе", tone: "accent" },
  in_progress: { label: "В работе", tone: "accent" },
  delivered: { label: "На приёмке", tone: "success" },
  released: { label: "Выплачен", tone: "muted" },
  disputed: { label: "Диспут", tone: "danger" },
  refunded: { label: "Возврат", tone: "muted" },
};

function toneClass(tone: "accent" | "success" | "danger" | "muted") {
  switch (tone) {
    case "success":
      return "border-[color-mix(in_srgb,var(--success)_35%,transparent)] bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-success";
    case "danger":
      return "border-[color-mix(in_srgb,var(--danger)_35%,transparent)] bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-danger";
    case "muted":
      return "border-border bg-panel-soft text-muted";
    default:
      return "border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-accent";
  }
}

function formatDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}

const statusOrder: EscrowStatus[] = [
  "delivered",
  "disputed",
  "in_progress",
  "funded",
  "pending_funding",
  "released",
  "refunded",
];

export default async function ClientWorkPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser(["client"]);
  const { error } = await searchParams;
  const deals = (await listDealsForUser(user.id)).filter((d) => d.clientId === user.id);
  const db = await getDb();

  const sorted = [...deals].sort(
    (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status),
  );

  const active = deals.filter((d) =>
    ["pending_funding", "funded", "in_progress", "delivered", "disputed"].includes(d.status),
  );
  const awaitingAccept = deals.filter((d) => d.status === "delivered");
  const escrowTotal = deals
    .filter((d) => ["funded", "in_progress", "delivered", "disputed"].includes(d.status))
    .reduce((sum, d) => sum + d.amount, 0);

  const rows = sorted.map((d) => {
    const project = db.projects.find((p) => p.id === d.projectId);
    const freelancer = db.users.find((u) => u.id === d.freelancerId);
    const thread = db.threads.find(
      (t) =>
        t.projectId === d.projectId &&
        t.participantIds.includes(user.id) &&
        t.participantIds.includes(d.freelancerId),
    );
    const reviewed = db.reviews.some(
      (r) => r.dealId === d.id && r.fromUserId === user.id,
    );
    return { deal: d, project, freelancer, thread, reviewed };
  });

  return (
    <div className="space-y-6">
      <Panel className="p-6 md:p-8">
        <PageTitle
          title="В работе"
          subtitle="Эскроу-сделки: оплата сейфа, приёмка, выплата и диспуты"
          action={
            <ButtonLink href="/client/projects" variant="ghost" className="!rounded-full !text-sm">
              Мои проекты
            </ButtonLink>
          }
        />

        {error && (
          <p className="mb-4 rounded-xl border border-danger/40 bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-panel-soft/70 px-4 py-4">
            <div className="flex items-center gap-2 text-xs text-muted">
              <ShieldCheck size={14} className="text-accent" />
              Активных
            </div>
            <div className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-text">
              {active.length}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-panel-soft/70 px-4 py-4">
            <div className="flex items-center gap-2 text-xs text-muted">
              <Clock3 size={14} className="text-accent" />
              На приёмке
            </div>
            <div className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-text">
              {awaitingAccept.length}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-panel-soft/70 px-4 py-4">
            <div className="flex items-center gap-2 text-xs text-muted">
              <Lock size={14} className="text-accent" />
              В сейфе
            </div>
            <div className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-text">
              {escrowTotal}{" "}
              <span className="text-sm font-semibold text-muted">USDT</span>
            </div>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="Нет активных сделок"
            hint="Выберите ставку в проекте — бюджет уйдёт в сейф до приёмки"
          />
        ) : (
          <div className="space-y-4">
            {rows.map(({ deal: d, project, freelancer, thread, reviewed }) => {
              const meta = statusMeta[d.status];
              const canFund = d.status === "pending_funding";
              const canRelease = d.status === "delivered";
              const canDispute = ["funded", "in_progress", "delivered"].includes(d.status);
              const fee = d.feeAmount ?? Math.round((d.amount * d.feePercent) / 100);
              const payout = d.amount - fee;

              return (
                <article
                  key={d.id}
                  className="overflow-hidden rounded-2xl border border-border bg-panel transition-colors hover:border-accent/35"
                >
                  <div className="flex flex-col gap-5 p-5 md:flex-row md:items-start md:justify-between md:p-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClass(meta.tone)}`}
                        >
                          {meta.label}
                        </span>
                        {d.status === "delivered" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success">
                            <CheckCircle2 size={12} />
                            Готово к выплате
                          </span>
                        )}
                        {d.status === "disputed" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-danger">
                            <AlertTriangle size={12} />
                            Разбирает команда DigiForge
                          </span>
                        )}
                      </div>

                      <h2 className="mt-3 font-[family-name:var(--font-syne)] text-xl font-bold leading-snug text-text">
                        <Link
                          href={`/client/projects/${d.projectId}`}
                          className="transition-colors hover:text-accent"
                        >
                          {project?.title ?? "Проект"}
                        </Link>
                      </h2>

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            name={freelancer?.name ?? "Исполнитель"}
                            url={freelancer?.avatarUrl}
                            size={36}
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-text">
                              {freelancer?.name ?? "Исполнитель"}
                            </div>
                            <div className="text-[11px] text-muted">
                              {freelancer?.title || "Фрилансер"}
                              {formatDate(d.fundedAt) ? ` · с ${formatDate(d.fundedAt)}` : null}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
                        {project?.category && (
                          <span className="rounded-lg border border-border px-2.5 py-1">
                            {project.category}
                          </span>
                        )}
                        {formatDate(d.deliveredAt) && (
                          <span className="rounded-lg border border-border px-2.5 py-1">
                            Сдано {formatDate(d.deliveredAt)}
                          </span>
                        )}
                        <span className="rounded-lg border border-border px-2.5 py-1">
                          Комиссия {d.feePercent}% · {fee} USDT
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 rounded-2xl border border-border bg-panel-soft/80 px-4 py-4 md:min-w-[180px] md:text-right">
                      <div className="text-[11px] uppercase tracking-wide text-muted">В сейфе</div>
                      <div className="mt-1 font-[family-name:var(--font-syne)] text-2xl font-bold text-accent">
                        {d.amount}
                        <span className="ml-1 text-sm font-semibold text-muted">USDT</span>
                      </div>
                      <div className="mt-1 text-[11px] text-muted">
                        Исполнителю после приёмки: {payout} USDT
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t border-border bg-[color-mix(in_srgb,var(--panel-soft)_55%,transparent)] px-5 py-3.5 md:px-6">
                    {canFund && (
                      <form action={fundDealAction}>
                        <input type="hidden" name="dealId" value={d.id} />
                        <Button type="submit" className="!rounded-full !px-5 !py-2 !text-sm">
                          Оплатить эскроу
                        </Button>
                      </form>
                    )}
                    {canRelease && (
                      <form action={releaseDealAction}>
                        <input type="hidden" name="dealId" value={d.id} />
                        <Button type="submit" className="!rounded-full !px-5 !py-2 !text-sm">
                          Принять и выплатить
                        </Button>
                      </form>
                    )}
                    {thread && (
                      <ButtonLink
                        href={`/client/messages/${thread.id}`}
                        variant="ghost"
                        className="!rounded-full !px-4 !py-2 !text-sm"
                      >
                        <span className="inline-flex items-center gap-2">
                          <MessageSquare size={14} />
                          Чат
                        </span>
                      </ButtonLink>
                    )}
                    <ButtonLink
                      href={`/client/projects/${d.projectId}`}
                      variant="ghost"
                      className="!rounded-full !px-4 !py-2 !text-sm"
                    >
                      К проекту
                    </ButtonLink>
                    {canDispute && (
                      <form action={disputeDealAction} className="sm:ml-auto">
                        <input type="hidden" name="dealId" value={d.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          className="!rounded-full !px-4 !py-2 !text-sm !text-danger hover:!border-danger/40"
                        >
                          Открыть диспут
                        </Button>
                      </form>
                    )}
                  </div>
                  {d.status === "released" && !reviewed && freelancer && (
                    <div className="border-t border-border px-5 py-4 md:px-6">
                      <ReviewForm
                        dealId={d.id}
                        toUserId={freelancer.id}
                        toName={freelancer.name}
                      />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}

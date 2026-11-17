import Link from "next/link";
import {
  Clock3,
  EyeOff,
  FolderKanban,
  MessageSquareQuote,
  Plus,
} from "lucide-react";
import { ButtonLink, EmptyState, PageTitle, Panel } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getDb, listProjects } from "@/lib/store";
import type { ProjectStatus } from "@/lib/types";

const statusMeta: Record<
  ProjectStatus,
  { label: string; tone: "accent" | "success" | "danger" | "muted" }
> = {
  open: { label: "Открыт", tone: "accent" },
  in_progress: { label: "В работе", tone: "accent" },
  delivered: { label: "Сдан", tone: "success" },
  completed: { label: "Завершён", tone: "muted" },
  disputed: { label: "Диспут", tone: "danger" },
  cancelled: { label: "Отменён", tone: "muted" },
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}

const statusOrder: ProjectStatus[] = [
  "open",
  "in_progress",
  "delivered",
  "disputed",
  "completed",
  "cancelled",
];

export default async function ClientProjectsPage() {
  const user = await requireUser(["client"]);
  const db = await getDb();
  const projects = (await listProjects())
    .filter((p) => p.clientId === user.id)
    .sort((a, b) => {
      const byStatus = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
      if (byStatus !== 0) return byStatus;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const openCount = projects.filter((p) => p.status === "open").length;
  const inProgressCount = projects.filter((p) =>
    ["in_progress", "delivered", "disputed"].includes(p.status),
  ).length;
  const pendingBids = projects.reduce((sum, p) => {
    return (
      sum +
      db.bids.filter((b) => b.projectId === p.id && b.status === "pending").length
    );
  }, 0);

  return (
    <div className="space-y-6">
      <Panel className="p-6 md:p-8">
        <PageTitle
          title="Мои проекты"
          subtitle="Заказы, ставки и статусы публикаций"
          action={
            <ButtonLink href="/client/projects/new" className="!rounded-full !text-sm">
              <span className="inline-flex items-center gap-2">
                <Plus size={14} />
                Новый проект
              </span>
            </ButtonLink>
          }
        />

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-panel-soft/70 px-4 py-4">
            <div className="flex items-center gap-2 text-xs text-muted">
              <FolderKanban size={14} className="text-accent" />
              Всего
            </div>
            <div className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-text">
              {projects.length}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-panel-soft/70 px-4 py-4">
            <div className="flex items-center gap-2 text-xs text-muted">
              <Clock3 size={14} className="text-accent" />
              Открытых / в работе
            </div>
            <div className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-text">
              {openCount}
              <span className="mx-1 text-muted">·</span>
              {inProgressCount}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-panel-soft/70 px-4 py-4">
            <div className="flex items-center gap-2 text-xs text-muted">
              <MessageSquareQuote size={14} className="text-accent" />
              Новых ставок
            </div>
            <div className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-text">
              {pendingBids}
            </div>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="space-y-4">
            <EmptyState title="Пока нет проектов" hint="Опубликуйте заказ — исполнители пришлют ставки" />
            <div className="flex justify-center">
              <ButtonLink href="/client/projects/new" className="!rounded-full">
                Создать первый проект
              </ButtonLink>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((p) => {
              const meta = statusMeta[p.status];
              const bids = db.bids.filter((b) => b.projectId === p.id);
              const pending = bids.filter((b) => b.status === "pending").length;
              const deal = db.deals.find((d) => d.projectId === p.id);

              return (
                <Link
                  key={p.id}
                  href={`/client/projects/${p.id}`}
                  className="group block overflow-hidden rounded-2xl border border-border bg-panel transition-colors hover:border-accent/40"
                >
                  <div className="flex flex-col gap-4 p-5 md:flex-row md:items-start md:justify-between md:p-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClass(meta.tone)}`}
                        >
                          {meta.label}
                        </span>
                        {p.bidsHidden && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-panel-soft px-2.5 py-1 text-[11px] text-muted">
                            <EyeOff size={11} />
                            Ставки скрыты
                          </span>
                        )}
                        {pending > 0 && p.status === "open" && (
                          <span className="rounded-full border border-[color-mix(in_srgb,var(--accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-2.5 py-1 text-[11px] font-semibold text-accent">
                            {pending}{" "}
                            {pending === 1 ? "новая ставка" : "новых ставок"}
                          </span>
                        )}
                      </div>

                      <h2 className="mt-3 font-[family-name:var(--font-syne)] text-lg font-bold leading-snug text-text transition-colors group-hover:text-accent md:text-xl">
                        {p.title}
                      </h2>
                      <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-relaxed text-muted">
                        {p.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
                        <span className="rounded-lg border border-border px-2.5 py-1">
                          {p.category}
                        </span>
                        <span className="rounded-lg border border-border px-2.5 py-1">
                          Срок {p.deadlineDays} дн.
                        </span>
                        <span className="rounded-lg border border-border px-2.5 py-1">
                          Создан {formatDate(p.createdAt)}
                        </span>
                        <span className="rounded-lg border border-border px-2.5 py-1">
                          Ставок: {bids.length}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 rounded-2xl border border-border bg-panel-soft/80 px-4 py-4 md:min-w-[168px] md:text-right">
                      <div className="text-[11px] uppercase tracking-wide text-muted">Бюджет</div>
                      <div className="mt-1 font-[family-name:var(--font-syne)] text-xl font-bold text-accent">
                        {p.budgetMin}–{p.budgetMax}
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted">USDT</div>
                      {deal && (
                        <div className="mt-3 border-t border-border pt-3 text-[11px] text-muted">
                          Эскроу{" "}
                          <span className="font-semibold text-text">{deal.amount} USDT</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}

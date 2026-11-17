import Link from "next/link";
import { FolderKanban, Gavel } from "lucide-react";
import { ButtonLink, EmptyState, PageTitle, Panel } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getDb, listBidsForFreelancer } from "@/lib/store";

type Tab = "active" | "accepted" | "all";

const TABS: { id: Tab; label: string }[] = [
  { id: "active", label: "Активные" },
  { id: "accepted", label: "Принятые" },
  { id: "all", label: "Все ставки" },
];

const STATUS_LABEL: Record<string, string> = {
  pending: "Ожидает",
  accepted: "Принята",
  rejected: "Отклонена",
  won: "Выиграна",
};

function formatAdded(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function daysLabel(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} день`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} дня`;
  return `${n} дней`;
}

export default async function FreelancerBidsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireUser(["freelancer"]);
  const { tab: tabRaw } = await searchParams;
  const tab: Tab =
    tabRaw === "accepted" || tabRaw === "all" || tabRaw === "active" ? tabRaw : "active";

  const bids = await listBidsForFreelancer(user.id);
  const db = await getDb();

  const filtered = bids
    .filter((b) => {
      if (tab === "active") return b.status === "pending";
      if (tab === "accepted") return b.status === "accepted" || b.status === "won";
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const counts = {
    active: bids.filter((b) => b.status === "pending").length,
    accepted: bids.filter((b) => b.status === "accepted" || b.status === "won").length,
    all: bids.length,
  };

  return (
    <Panel className="overflow-hidden p-0">
      <div className="border-b border-border px-6 py-5 md:px-8">
        <PageTitle
          title="Ставки"
          subtitle="Отклики на проекты"
          className="mb-0"
          action={
            <ButtonLink href="/freelancer/projects" className="!rounded-full !px-4 !py-2 !text-sm">
              Найти проект
            </ButtonLink>
          }
        />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border px-6 py-3 md:px-8">
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <Link
              key={t.id}
              href={t.id === "active" ? "/freelancer/bids" : `/freelancer/bids?tab=${t.id}`}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm transition ${
                on
                  ? "bg-accent text-[#1a120c] font-semibold"
                  : "border border-border text-muted hover:border-accent/40 hover:text-text"
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-1.5 text-[11px] ${
                  on ? "bg-[#1a120c]/15" : "bg-panel-soft text-muted"
                }`}
              >
                {counts[t.id]}
              </span>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="px-6 py-12 md:px-8">
          <EmptyState
            title={tab === "active" ? "Нет активных ставок" : "В этом разделе пусто"}
            hint="Откройте маркетплейс и откликнитесь на проект"
          />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted">
                  <th className="px-6 py-3 font-medium md:px-8">Проект</th>
                  <th className="px-3 py-3 font-medium">Категория</th>
                  <th className="px-3 py-3 font-medium">Бюджет</th>
                  <th className="px-3 py-3 font-medium">Ставка</th>
                  <th className="px-3 py-3 font-medium">Срок</th>
                  <th className="px-3 py-3 font-medium">Добавлено</th>
                  <th className="px-6 py-3 font-medium md:px-8">Статус</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const project = db.projects.find((p) => p.id === b.projectId);
                  return (
                    <tr
                      key={b.id}
                      className="border-b border-border/70 transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]"
                    >
                      <td className="px-6 py-4 md:px-8">
                        <Link
                          href={`/freelancer/projects/${b.projectId}`}
                          className="group flex items-start gap-2.5"
                        >
                          <FolderKanban
                            size={16}
                            className="mt-0.5 shrink-0 text-accent opacity-80"
                          />
                          <span className="font-semibold text-text group-hover:text-accent">
                            {project?.title ?? "Проект"}
                          </span>
                        </Link>
                      </td>
                      <td className="px-3 py-4 text-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <Gavel size={14} className="text-accent/70" />
                          <span className="max-w-[10rem] truncate">
                            {project?.category ?? "—"}
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-4 text-muted">
                        {project
                          ? `${project.budgetMin}–${project.budgetMax} USDT`
                          : "—"}
                      </td>
                      <td className="px-3 py-4">
                        <span className="inline-flex rounded-full border border-accent/35 bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-2.5 py-1 text-xs font-semibold text-accent">
                          {b.amount} USDT
                        </span>
                      </td>
                      <td className="px-3 py-4 text-muted">{daysLabel(b.days)}</td>
                      <td className="px-3 py-4 text-muted">{formatAdded(b.createdAt)}</td>
                      <td className="px-6 py-4 md:px-8">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            b.status === "pending"
                              ? "bg-panel-soft text-muted-2"
                              : b.status === "accepted" || b.status === "won"
                                ? "bg-[color-mix(in_srgb,var(--success)_18%,transparent)] text-success"
                                : "bg-[color-mix(in_srgb,var(--danger)_16%,transparent)] text-danger"
                          }`}
                        >
                          {STATUS_LABEL[b.status] ?? b.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 p-4 md:hidden">
            {filtered.map((b) => {
              const project = db.projects.find((p) => p.id === b.projectId);
              return (
                <Link
                  key={b.id}
                  href={`/freelancer/projects/${b.projectId}`}
                  className="block rounded-2xl border border-border bg-panel-soft/40 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 font-semibold text-text">{project?.title}</div>
                    <span className="shrink-0 text-xs font-semibold text-accent">
                      {b.amount} USDT
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                    <span>{daysLabel(b.days)}</span>
                    <span>{formatAdded(b.createdAt)}</span>
                    <span>{STATUS_LABEL[b.status]}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </Panel>
  );
}

import Link from "next/link";
import { adminCancelProjectAction } from "@/app/actions/admin";
import { Button, Chip, EmptyState, PageTitle, Panel } from "@/components/ui";
import { projectStatusLabel, timeAgo } from "@/lib/admin-labels";
import { requireUser } from "@/lib/auth";
import { listAllForAdmin } from "@/lib/store";
import type { ProjectStatus } from "@/lib/types";

type SearchParams = Promise<{ status?: string; q?: string }>;

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireUser(["admin"]);
  const sp = await searchParams;
  const status = (sp.status ?? "all") as ProjectStatus | "all";
  const q = (sp.q ?? "").trim().toLowerCase();
  const db = await listAllForAdmin();

  let projects = [...db.projects].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  if (status !== "all") projects = projects.filter((p) => p.status === status);
  if (q) {
    projects = projects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }

  const statusTabs: Array<ProjectStatus | "all"> = [
    "all",
    "open",
    "in_progress",
    "delivered",
    "completed",
    "disputed",
    "cancelled",
  ];

  function href(nextStatus: string) {
    const params = new URLSearchParams();
    if (nextStatus !== "all") params.set("status", nextStatus);
    if (sp.q) params.set("q", sp.q);
    const s = params.toString();
    return s ? `/admin/projects?${s}` : "/admin/projects";
  }

  return (
    <Panel className="p-6 md:p-8">
      <PageTitle title="Проекты" subtitle="Модерация заказов на бирже" />

      <form className="mb-4 flex flex-wrap gap-2" action="/admin/projects" method="get">
        {status !== "all" && <input type="hidden" name="status" value={status} />}
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Название, категория, id…"
          className="df-input min-w-[220px] flex-1"
        />
        <button type="submit" className="df-btn df-btn-primary rounded-xl px-4 py-2 text-sm font-semibold">
          Найти
        </button>
      </form>

      <div className="mb-5 flex flex-wrap gap-2">
        {statusTabs.map((s) => {
          const active = status === s;
          const label = s === "all" ? "Все" : projectStatusLabel[s];
          return (
            <Link
              key={s}
              href={href(s)}
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

      {projects.length === 0 ? (
        <EmptyState title="Проектов нет" />
      ) : (
        <div className="space-y-3">
          {projects.map((p) => {
            const client = db.users.find((u) => u.id === p.clientId);
            const bids = db.bids.filter((b) => b.projectId === p.id).length;
            return (
              <div key={p.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold">{p.title}</div>
                    <div className="mt-1 text-sm text-muted">
                      {client?.name ?? p.clientId} · {p.category} ·{" "}
                      {p.budgetMin}–{p.budgetMax} USDT · {bids} ставок ·{" "}
                      {timeAgo(p.createdAt)}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-2">{p.description}</p>
                  </div>
                  <Chip>{projectStatusLabel[p.status]}</Chip>
                </div>
                {p.status === "open" && (
                  <form action={adminCancelProjectAction} className="mt-3">
                    <input type="hidden" name="projectId" value={p.id} />
                    <Button type="submit" variant="ghost">
                      Отменить проект
                    </Button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

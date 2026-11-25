import Link from "next/link";
import { notFound } from "next/navigation";
import {
  acceptBidAction,
  closeProjectAction,
  rejectBidAction,
} from "@/app/actions/marketplace";
import { Button, ButtonLink, Chip, Input, PageTitle, Panel } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatProjectBudget } from "@/lib/project-budget";
import { getDb, getProject, listBidsForProject } from "@/lib/store";

export default async function ClientProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser(["client"]);
  const { id } = await params;
  const { error } = await searchParams;
  const project = await getProject(id);
  if (!project || project.clientId !== user.id) notFound();
  const bids = await listBidsForProject(id);
  const db = await getDb();

  return (
    <Panel className="p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle title={project.title} subtitle={project.description} className="mb-0" />
        {project.status === "open" && (
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={`/client/projects/${project.id}/edit`} variant="ghost">
              Редактировать
            </ButtonLink>
            <form action={closeProjectAction}>
              <input type="hidden" name="projectId" value={project.id} />
              <Button type="submit" variant="ghost" className="!text-danger">
                Закрыть проект
              </Button>
            </form>
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Chip>{project.status}</Chip>
        <Chip>{formatProjectBudget(project)}</Chip>
        <Chip>{project.category}</Chip>
        <Chip>{project.deadlineDays} дн.</Chip>
      </div>
      {(project.skills?.length ?? 0) > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.skills!.map((s) => (
            <span
              key={s}
              className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-2"
            >
              {s}
            </span>
          ))}
        </div>
      )}
      {(project.attachments?.length ?? 0) > 0 && (
        <div className="mt-4 space-y-1 text-sm">
          <div className="text-muted">Вложения</div>
          {project.attachments!.map((a) => (
            <a
              key={a.url}
              href={a.url}
              target="_blank"
              rel="noreferrer"
              className="block text-accent hover:underline"
            >
              {a.name}
            </a>
          ))}
        </div>
      )}
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      <h2 className="mt-8 font-[family-name:var(--font-syne)] text-lg font-semibold">Ставки</h2>
      <p className="mt-1 text-sm text-muted">
        Одобрите цену фрилансера или укажите свою сумму перед эскроу. Можно отклонить отдельную ставку.
      </p>
      <div className="mt-4 space-y-3">
        {bids.length === 0 && <p className="text-sm text-muted">Пока нет ставок</p>}
        {bids.map((b) => {
          const fl = db.users.find((u) => u.id === b.freelancerId);
          return (
            <div key={b.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">
                    {fl ? (
                      <Link href={`/freelancers/${fl.id}`} className="hover:text-accent">
                        {fl.name}
                      </Link>
                    ) : (
                      "Фрилансер"
                    )}{" "}
                    · {b.amount} USDT · {b.days} дн.
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{b.comment}</p>
                  <div className="mt-2 text-xs text-muted">Статус: {b.status}</div>
                </div>
                {project.status === "open" && b.status === "pending" && (
                  <div className="flex w-full max-w-xs flex-col gap-2 sm:w-auto">
                    <form action={acceptBidAction} className="flex flex-col gap-2">
                      <input type="hidden" name="projectId" value={project.id} />
                      <input type="hidden" name="bidId" value={b.id} />
                      <label className="text-xs text-muted">
                        Сумма эскроу USDT
                        <Input
                          name="amount"
                          type="number"
                          min={1}
                          step="1"
                          required
                          defaultValue={b.amount}
                          className="mt-1"
                        />
                      </label>
                      <Button type="submit">Одобрить и открыть эскроу</Button>
                    </form>
                    <form action={rejectBidAction}>
                      <input type="hidden" name="projectId" value={project.id} />
                      <input type="hidden" name="bidId" value={b.id} />
                      <Button type="submit" variant="ghost" className="w-full !text-danger">
                        Отклонить
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

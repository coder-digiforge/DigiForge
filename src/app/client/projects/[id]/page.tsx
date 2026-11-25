import Link from "next/link";
import { notFound } from "next/navigation";
import {
  acceptBidAction,
  addProjectCommentAction,
  closeProjectAction,
  messageBidderAction,
  rejectBidAction,
  thankProjectCommentAction,
} from "@/app/actions/marketplace";
import { UserAvatar } from "@/components/UserAvatar";
import {
  Button,
  ButtonLink,
  Chip,
  Input,
  PageTitle,
  Panel,
  Textarea,
} from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatProjectBudget } from "@/lib/project-budget";
import { getDb, getProject, listBidsForProject, listProjectComments } from "@/lib/store";

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
  const comments = await listProjectComments(id);
  const db = await getDb();
  const returnTo = `/client/projects/${id}`;
  const roots = comments.filter((c) => !c.parentId);
  const repliesOf = (cid: string) => comments.filter((c) => c.parentId === cid);
  const threadByFreelancer = new Map<string, string>();
  for (const t of db.threads) {
    if (t.projectId !== id || !t.participantIds.includes(user.id)) continue;
    const other = t.participantIds.find((pid) => pid !== user.id);
    if (!other) continue;
    const prev = threadByFreelancer.get(other);
    if (!prev || t.dealId) threadByFreelancer.set(other, t.id);
  }

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
          const existingThreadId = threadByFreelancer.get(b.freelancerId);
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
                  {(b.status === "pending" || b.status === "accepted") && (
                    <form action={messageBidderAction} className="mt-4 max-w-lg space-y-2">
                      <input type="hidden" name="projectId" value={project.id} />
                      <input type="hidden" name="freelancerId" value={b.freelancerId} />
                      <label className="block text-xs text-muted">
                        Сообщение фрилансеру
                        <Textarea
                          name="body"
                          className="mt-1"
                          placeholder="Уточните детали по отклику…"
                          required
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <Button type="submit" variant="ghost" className="!text-sm">
                          Написать
                        </Button>
                        {existingThreadId && (
                          <ButtonLink
                            href={`/client/messages/${existingThreadId}`}
                            variant="ghost"
                            className="!text-sm"
                          >
                            Открыть чат
                          </ButtonLink>
                        )}
                      </div>
                    </form>
                  )}
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

      <h2 className="mt-10 font-[family-name:var(--font-syne)] text-lg font-semibold">
        Обсуждение
      </h2>
      <p className="mt-1 text-sm text-muted">
        Публичные уточняющие вопросы по проекту — как на бирже.
      </p>
      <div className="mt-4 space-y-3">
        {roots.length === 0 && (
          <p className="text-sm text-muted">Пока тихо — фрилансеры могут задать вопрос здесь.</p>
        )}
        {roots.map((root) => {
          const author = db.users.find((u) => u.id === root.authorId);
          const replies = repliesOf(root.id);
          return (
            <div key={root.id} className="space-y-2">
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-start gap-3">
                  <UserAvatar name={author?.name ?? "Участник"} url={author?.avatarUrl} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{author?.name ?? "Участник"}</div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{root.body}</p>
                    <form action={thankProjectCommentAction} className="mt-2">
                      <input type="hidden" name="commentId" value={root.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <button type="submit" className="text-xs text-muted hover:text-accent">
                        Поблагодарить
                        {root.thanksCount > 0 ? ` · ${root.thanksCount}` : ""}
                      </button>
                    </form>
                    <form action={addProjectCommentAction} className="mt-3 space-y-2">
                      <input type="hidden" name="projectId" value={project.id} />
                      <input type="hidden" name="parentId" value={root.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <Textarea name="body" required placeholder="Ответить…" className="min-h-[64px]" />
                      <Button type="submit" variant="ghost" className="!text-sm">
                        Ответить
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
              {replies.map((r) => {
                const ra = db.users.find((u) => u.id === r.authorId);
                return (
                  <div
                    key={r.id}
                    className="ml-6 rounded-xl border border-border bg-panel-soft/40 p-4 md:ml-10"
                  >
                    <div className="flex items-start gap-3">
                      <UserAvatar name={ra?.name ?? "Участник"} url={ra?.avatarUrl} size={32} />
                      <div>
                        <div className="text-sm font-semibold">{ra?.name ?? "Участник"}</div>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{r.body}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
        <form action={addProjectCommentAction} className="space-y-2 rounded-xl border border-border p-4">
          <input type="hidden" name="projectId" value={project.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <label className="block text-xs text-muted">
            Добавить комментарий
            <Textarea
              name="body"
              required
              className="mt-1"
              placeholder="Ответьте на вопросы или уточните ТЗ…"
            />
          </label>
          <Button type="submit">Добавить комментарий</Button>
        </form>
      </div>
    </Panel>
  );
}

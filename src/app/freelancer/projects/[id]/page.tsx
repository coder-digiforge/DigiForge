import { createBidAction } from "@/app/actions/marketplace";
import { Button, Chip, Input, PageTitle, Panel, Textarea } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getProject, listBidsForProject } from "@/lib/store";
import { notFound } from "next/navigation";

export default async function FreelancerProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser(["freelancer"]);
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  const bids = await listBidsForProject(id);
  const myBid = bids.find((b) => b.freelancerId === user.id);

  return (
    <Panel className="p-6 md:p-8">
      <PageTitle title={project.title} subtitle={project.description} />
      <div className="flex flex-wrap gap-2">
        <Chip>
          {project.budgetMin}–{project.budgetMax} USDT
        </Chip>
        <Chip>{project.deadlineDays} дней</Chip>
        <Chip>{project.category}</Chip>
      </div>

      {!project.bidsHidden && (
        <div className="mt-6 text-sm text-muted">Открытых ставок: {bids.length}</div>
      )}
      {project.bidsHidden && (
        <div className="mt-6 text-sm text-muted">Ставки скрыты до выбора исполнителя</div>
      )}

      {myBid ? (
        <div className="mt-8 rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm">
          Ваша ставка: {myBid.amount} USDT · {myBid.days} дн. · {myBid.status}
        </div>
      ) : project.status === "open" ? (
        <form action={createBidAction} className="mt-8 max-w-xl space-y-4 rounded-xl border border-border p-5">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
            Публикация ставки
          </h2>
          <input type="hidden" name="projectId" value={project.id} />
          <div>
            <label className="mb-1 block text-sm text-muted">Комментарий *</label>
            <Textarea
              name="comment"
              required
              defaultValue="Соберу решение по брифу. Срок и правки после приёмки входят."
            />
            <p className="mt-1 text-xs text-muted">
              Контакты в ставке нельзя — заказчик увидит их после выбора.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-muted">Стоимость USDT *</label>
              <Input name="amount" type="number" required defaultValue={1200} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">Срок, дней *</label>
              <Input name="days" type="number" required defaultValue={12} />
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" name="transferCopyright" value="keep" defaultChecked />
              Не передаю авторские права
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="transferCopyright" value="license" />
              Передаю авторские права по лицензии
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="hideFromOthers" />
            Скрыть ставку от других
          </label>
          <Button type="submit">Сделать ставку</Button>
        </form>
      ) : null}
    </Panel>
  );
}

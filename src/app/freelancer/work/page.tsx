import { deliverDealAction, disputeDealAction } from "@/app/actions/marketplace";
import { Button, Chip, EmptyState, PageTitle, Panel } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getDb, listDealsForUser } from "@/lib/store";

export default async function FreelancerWorkPage() {
  const user = await requireUser(["freelancer"]);
  const deals = (await listDealsForUser(user.id)).filter((d) => d.freelancerId === user.id);
  const db = await getDb();

  return (
    <Panel className="p-6 md:p-8">
      <PageTitle title="В работе" subtitle="Активные эскроу-сделки" />
      {deals.length === 0 ? (
        <EmptyState title="Нет активных сделок" />
      ) : (
        <div className="space-y-4">
          {deals.map((d) => {
            const project = db.projects.find((p) => p.id === d.projectId);
            return (
              <div key={d.id} className="rounded-xl border border-border p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold">{project?.title}</div>
                    <div className="mt-1 text-sm text-muted">{d.amount} USDT в эскроу</div>
                  </div>
                  <Chip>{d.status}</Chip>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {d.status === "in_progress" && (
                    <form action={deliverDealAction}>
                      <input type="hidden" name="dealId" value={d.id} />
                      <Button type="submit">Сдать работу</Button>
                    </form>
                  )}
                  {!["released", "refunded"].includes(d.status) && (
                    <form action={disputeDealAction}>
                      <input type="hidden" name="dealId" value={d.id} />
                      <Button type="submit" variant="ghost">
                        Диспут
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

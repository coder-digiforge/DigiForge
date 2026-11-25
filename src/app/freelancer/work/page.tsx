import { deliverDealAction, disputeDealAction } from "@/app/actions/marketplace";
import { ReviewForm } from "@/components/ReviewForm";
import { Button, Chip, EmptyState, PageTitle, Panel } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getDb, isDealReviewPairComplete, listDealsForUser } from "@/lib/store";

export default async function FreelancerWorkPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser(["freelancer"]);
  const { error } = await searchParams;
  const deals = (await listDealsForUser(user.id)).filter((d) => d.freelancerId === user.id);
  const db = await getDb();

  return (
    <Panel className="p-6 md:p-8">
      <PageTitle title="В работе" subtitle="Активные эскроу-сделки" />
      {error && <p className="mb-4 text-sm text-danger">{error}</p>}
      {deals.length === 0 ? (
        <EmptyState title="Нет активных сделок" />
      ) : (
        <div className="space-y-4">
          {deals.map((d) => {
            const project = db.projects.find((p) => p.id === d.projectId);
            const client = db.users.find((u) => u.id === d.clientId);
            const reviewed = db.reviews.some(
              (r) => r.dealId === d.id && r.fromUserId === user.id,
            );
            const reviewsPublished = isDealReviewPairComplete(db, d.id);
            return (
              <div key={d.id} className="rounded-xl border border-border p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold">{project?.title}</div>
                    <div className="mt-1 text-sm text-muted">
                      {d.status === "pending_funding"
                        ? `${d.amount} USDT · ожидает оплату заказчиком`
                        : `${d.amount} USDT в эскроу`}
                      {client ? ` · ${client.name}` : ""}
                    </div>
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
                  {["funded", "in_progress", "delivered"].includes(d.status) && (
                    <form action={disputeDealAction}>
                      <input type="hidden" name="dealId" value={d.id} />
                      <Button type="submit" variant="ghost">
                        Диспут
                      </Button>
                    </form>
                  )}
                </div>
                {d.status === "released" && !reviewed && client && (
                  <ReviewForm dealId={d.id} toUserId={client.id} toName={client.name} />
                )}
                {d.status === "released" && reviewed && !reviewsPublished && (
                  <p className="mt-3 rounded-xl border border-border bg-panel-soft/60 px-4 py-3 text-sm text-muted">
                    Ваш отзыв сохранён · станет виден, когда заказчик ответит своим.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

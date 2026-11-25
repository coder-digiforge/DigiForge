import { ReviewForm } from "@/components/ReviewForm";
import { ReviewsPanel } from "@/components/ReviewsPanel";
import { Panel } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getDb, listDealsForUser, listReviewsForUser } from "@/lib/store";

export default async function FreelancerReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireUser(["freelancer"]);
  const { saved } = await searchParams;
  const reviews = await listReviewsForUser(user.id);
  const db = await getDb();
  const deals = (await listDealsForUser(user.id)).filter(
    (d) => d.freelancerId === user.id && d.status === "released",
  );
  const pending = deals.filter(
    (d) => !db.reviews.some((r) => r.dealId === d.id && r.fromUserId === user.id),
  );

  const cards = reviews
    .map((r) => {
      const from = db.users.find((u) => u.id === r.fromUserId);
      return {
        id: r.id,
        rating: r.rating,
        text: r.text,
        createdAt: r.createdAt,
        fromName: from?.name ?? "Заказчик",
        fromRole: from?.title ?? "Заказчик",
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const averageRating =
    cards.length === 0
      ? user.rating
      : cards.reduce((s, r) => s + r.rating, 0) / cards.length;

  return (
    <div className="space-y-6">
      {saved && (
        <p className="rounded-xl border border-success/35 bg-[color-mix(in_srgb,var(--success)_12%,transparent)] px-4 py-3 text-sm text-success">
          Отзыв сохранён
        </p>
      )}
      {pending.length > 0 && (
        <Panel className="space-y-4 p-6">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
            Оставить отзыв
          </h2>
          {pending.map((d) => {
            const client = db.users.find((u) => u.id === d.clientId);
            const project = db.projects.find((p) => p.id === d.projectId);
            if (!client) return null;
            return (
              <div key={d.id}>
                <p className="text-sm text-muted">
                  {project?.title ?? "Сделка"} · {client.name}
                </p>
                <ReviewForm dealId={d.id} toUserId={client.id} toName={client.name} />
              </div>
            );
          })}
        </Panel>
      )}
      <ReviewsPanel
        title="Отзывы"
        subtitle="Что пишут заказчики после сделок"
        reviews={cards}
        averageRating={averageRating}
      />
    </div>
  );
}

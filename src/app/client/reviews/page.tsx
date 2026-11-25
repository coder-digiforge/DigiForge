import { ReviewForm } from "@/components/ReviewForm";
import { ReviewsPanel } from "@/components/ReviewsPanel";
import { Panel } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import {
  getDb,
  isDealReviewPairComplete,
  listDealsForUser,
  listReviewsForUser,
} from "@/lib/store";

export default async function ClientReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireUser(["client"]);
  const { saved } = await searchParams;
  const reviews = await listReviewsForUser(user.id);
  const db = await getDb();
  const deals = (await listDealsForUser(user.id)).filter(
    (d) => d.clientId === user.id && d.status === "released",
  );
  const pending = deals.filter(
    (d) => !db.reviews.some((r) => r.dealId === d.id && r.fromUserId === user.id),
  );
  const awaitingReply = deals.filter(
    (d) =>
      db.reviews.some((r) => r.dealId === d.id && r.fromUserId === user.id) &&
      !isDealReviewPairComplete(db, d.id),
  );

  const cards = reviews
    .map((r) => {
      const from = db.users.find((u) => u.id === r.fromUserId);
      return {
        id: r.id,
        rating: r.rating,
        text: r.text,
        createdAt: r.createdAt,
        fromName: from?.name ?? "Исполнитель",
        fromRole: from?.title ?? "Фрилансер",
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
          Отзыв сохранён. Он станет виден, когда исполнитель ответит своим отзывом.
        </p>
      )}
      {pending.length > 0 && (
        <Panel className="space-y-4 p-6">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
            Оставить отзыв
          </h2>
          <p className="text-sm text-muted">
            Отзывы публикуются только после взаимного обмена.
          </p>
          {pending.map((d) => {
            const fl = db.users.find((u) => u.id === d.freelancerId);
            const project = db.projects.find((p) => p.id === d.projectId);
            if (!fl) return null;
            return (
              <div key={d.id}>
                <p className="text-sm text-muted">
                  {project?.title ?? "Сделка"} · {fl.name}
                </p>
                <ReviewForm dealId={d.id} toUserId={fl.id} toName={fl.name} />
              </div>
            );
          })}
        </Panel>
      )}
      {awaitingReply.length > 0 && (
        <Panel className="space-y-3 p-6">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
            Ожидают ответный отзыв
          </h2>
          <p className="text-sm text-muted">
            Ваш отзыв уже записан. Ответ собеседника и оба текста появятся после его ответа.
          </p>
          <ul className="space-y-2">
            {awaitingReply.map((d) => {
              const fl = db.users.find((u) => u.id === d.freelancerId);
              const project = db.projects.find((p) => p.id === d.projectId);
              return (
                <li
                  key={d.id}
                  className="rounded-xl border border-border bg-panel-soft/50 px-4 py-3 text-sm text-muted-2"
                >
                  {project?.title ?? "Сделка"} · {fl?.name ?? "Исполнитель"}
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
      <ReviewsPanel
        title="Отзывы"
        subtitle="Отзывы исполнителей о вас как о заказчике · видны после взаимного обмена"
        reviews={cards}
        averageRating={averageRating}
      />
    </div>
  );
}

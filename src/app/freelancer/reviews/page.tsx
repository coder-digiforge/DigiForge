import { ReviewsPanel } from "@/components/ReviewsPanel";
import { requireUser } from "@/lib/auth";
import { getDb, listReviewsForUser } from "@/lib/store";

export default async function FreelancerReviewsPage() {
  const user = await requireUser(["freelancer"]);
  const reviews = await listReviewsForUser(user.id);
  const db = await getDb();

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
    <ReviewsPanel
      title="Отзывы"
      subtitle="Что пишут заказчики после сделок"
      reviews={cards}
      averageRating={averageRating}
    />
  );
}

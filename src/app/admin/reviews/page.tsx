import Link from "next/link";
import { adminDeleteReviewAction } from "@/app/actions/admin";
import { Button, EmptyState, PageTitle, Panel } from "@/components/ui";
import { timeAgo } from "@/lib/admin-labels";
import { requireUser } from "@/lib/auth";
import { listAllForAdmin } from "@/lib/store";

export default async function AdminReviewsPage() {
  await requireUser(["admin"]);
  const db = await listAllForAdmin();
  const reviews = [...db.reviews].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  return (
    <Panel className="p-6 md:p-8">
      <PageTitle title="Отзывы" subtitle="Модерация отзывов по сделкам" />

      {reviews.length === 0 ? (
        <EmptyState title="Отзывов пока нет" />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => {
            const from = db.users.find((u) => u.id === r.fromUserId);
            const to = db.users.find((u) => u.id === r.toUserId);
            const deal = db.deals.find((d) => d.id === r.dealId);
            const project = deal
              ? db.projects.find((p) => p.id === deal.projectId)
              : undefined;
            return (
              <div key={r.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold">
                      {r.rating}/5 · {project?.title ?? r.dealId}
                    </div>
                    <div className="mt-1 text-sm text-muted">
                      От{" "}
                      <Link
                        href={`/admin/users/${r.fromUserId}`}
                        className="text-accent hover:underline"
                      >
                        {from?.name ?? r.fromUserId}
                      </Link>
                      {" → "}
                      <Link
                        href={`/admin/users/${r.toUserId}`}
                        className="text-accent hover:underline"
                      >
                        {to?.name ?? r.toUserId}
                      </Link>
                      {" · "}
                      {timeAgo(r.createdAt)}
                    </div>
                    <p className="mt-2 text-sm text-muted-2">{r.text}</p>
                  </div>
                  <form action={adminDeleteReviewAction}>
                    <input type="hidden" name="reviewId" value={r.id} />
                    <Button type="submit" variant="ghost">
                      Удалить
                    </Button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

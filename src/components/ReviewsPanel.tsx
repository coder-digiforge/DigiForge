import { Star } from "lucide-react";
import { EmptyState, PageTitle, Panel } from "@/components/ui";

export type ReviewCardItem = {
  id: string;
  rating: number;
  text: string;
  createdAt: string;
  fromName: string;
  fromRole?: string;
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} из 5`}>
      {Array.from({ length: 5 }, (_, i) => {
        const on = i < rating;
        return (
          <Star
            key={i}
            size={16}
            className={on ? "fill-accent text-accent" : "text-border"}
          />
        );
      })}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ReviewsPanel({
  title,
  subtitle,
  reviews,
  averageRating,
}: {
  title: string;
  subtitle: string;
  reviews: ReviewCardItem[];
  averageRating: number;
}) {
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }));
  const maxBar = Math.max(1, ...distribution.map((d) => d.count));

  return (
    <div className="space-y-6">
      <PageTitle title={title} subtitle={subtitle} className="mb-0" />

      {reviews.length === 0 ? (
        <Panel className="p-8 md:p-12">
          <EmptyState title="Пока нет отзывов" hint="Они появятся после завершённых сделок" />
        </Panel>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(220px,0.85fr)_minmax(0,1.4fr)]">
            <Panel className="flex flex-col items-center justify-center p-6 text-center md:p-8">
              <div className="text-xs uppercase tracking-wider text-muted">Средняя оценка</div>
              <div className="mt-3 font-[family-name:var(--font-syne)] text-5xl font-bold text-text">
                {averageRating.toFixed(1)}
              </div>
              <div className="mt-3">
                <Stars rating={Math.round(averageRating)} />
              </div>
              <p className="mt-3 text-sm text-muted">
                {reviews.length}{" "}
                {reviews.length === 1 ? "отзыв" : reviews.length < 5 ? "отзыва" : "отзывов"}
              </p>
            </Panel>

            <Panel className="p-5 md:p-6">
              <div className="mb-4 text-sm font-semibold text-text">Распределение оценок</div>
              <div className="space-y-2.5">
                {distribution.map((d) => (
                  <div key={d.stars} className="flex items-center gap-3 text-sm">
                    <span className="w-8 shrink-0 text-muted">{d.stars}★</span>
                    <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]">
                      <div
                        className="h-full rounded-full bg-accent transition-[width] duration-500"
                        style={{ width: `${(d.count / maxBar) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 shrink-0 text-right text-muted">{d.count}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="space-y-3">
            {reviews.map((r) => (
              <article
                key={r.id}
                className="rounded-2xl border border-border bg-panel p-5 transition hover:border-accent/35 md:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-sm font-semibold text-accent">
                      {r.fromName.slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-semibold text-text">{r.fromName}</div>
                      {r.fromRole && <div className="text-xs text-muted">{r.fromRole}</div>}
                    </div>
                  </div>
                  <div className="text-right">
                    <Stars rating={r.rating} />
                    <div className="mt-1 text-xs text-muted">{formatDate(r.createdAt)}</div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-2">{r.text}</p>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

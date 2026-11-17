import Link from "next/link";
import { Crown, ShieldCheck, Star } from "lucide-react";
import { PortfolioGallery } from "@/components/PortfolioGallery";
import { UserAvatar } from "@/components/UserAvatar";
import { ButtonLink, Chip, Panel } from "@/components/ui";
import type { PortfolioCase, Review, User } from "@/lib/types";

const COVER_FALLBACKS = [
  "/landing/hero-viz.png",
  "/landing/ico-web.png",
  "/landing/ico-design.png",
  "/landing/step-choose.png",
];

function coverFor(id: string, coverUrl?: string) {
  if (coverUrl) return coverUrl;
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return COVER_FALLBACKS[n % COVER_FALLBACKS.length];
}

export function FreelancerPublicView({
  user,
  portfolio,
  reviews,
  basePath = "/freelancers",
  variant = "public",
}: {
  user: User;
  portfolio: PortfolioCase[];
  reviews: Review[];
  basePath?: string;
  variant?: "public" | "cabinet";
}) {
  const primeActive =
    Boolean(user.digiPrimeUntil) && new Date(user.digiPrimeUntil!).getTime() > Date.now();
  const shellClass =
    variant === "public" ? "mx-auto max-w-5xl px-6 py-12 md:px-12" : "space-y-6";

  return (
    <div className={shellClass}>
      <Link href={basePath} className="text-sm font-medium text-accent hover:underline">
        ← Каталог исполнителей
      </Link>

      <div className={`${variant === "public" ? "mt-8" : "mt-4"} grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]`}>
        <div className="min-w-0 space-y-5">
          <Panel className="overflow-hidden p-0">
            <div className="border-b border-border bg-[linear-gradient(135deg,#2a2118_0%,#1a1511_55%,#14100d_100%)] px-6 py-7 md:px-8">
              <div className="flex flex-wrap items-center gap-5">
                <UserAvatar name={user.name} url={user.avatarUrl} size={80} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-[family-name:var(--font-syne)] text-[28px] font-bold leading-tight text-[#f5e6c8]">
                      {user.name}
                    </h1>
                    {primeActive && (
                      <Crown size={18} className="text-accent" aria-label="Digi Prime" />
                    )}
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-accent">
                    {user.title || "Фрилансер DigiForge"}
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    ★ {user.rating.toFixed(1)} · {user.reviewCount || reviews.length} отзывов
                    {primeActive ? " · Digi Prime" : ""}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 md:p-8">
              <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-[#f5e6c8]">
                О себе
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-2">
                {user.bio || "Профиль в разработке"}
              </p>
              {user.skills.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {user.skills.map((s) => (
                    <Chip key={s}>{s}</Chip>
                  ))}
                </div>
              )}
            </div>
          </Panel>

          <div>
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-[#f5e6c8]">
              Портфолио
            </h2>
            {portfolio.length === 0 ? (
              <Panel className="mt-4 p-8 text-center text-sm text-muted">Пока нет кейсов</Panel>
            ) : (
              <div className="mt-4">
                <PortfolioGallery
                  items={portfolio.map((c) => ({
                    id: c.id,
                    title: c.title,
                    summary: c.summary,
                    tags: c.tags ?? [],
                    priceUsdt: c.priceUsdt,
                    projectUrl: c.projectUrl,
                    cover: coverFor(c.id, c.coverUrl),
                  }))}
                />
              </div>
            )}
          </div>

          <div>
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-[#f5e6c8]">
              Отзывы
            </h2>
            {reviews.length === 0 ? (
              <Panel className="mt-4 p-8 text-center text-sm text-muted">Пока нет отзывов</Panel>
            ) : (
              <div className="mt-4 space-y-3">
                {reviews.map((r) => (
                  <Panel key={r.id} className="p-5">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < r.rating ? "fill-accent text-accent" : "text-border"}
                        />
                      ))}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-2">{r.text}</p>
                  </Panel>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Panel className="border-accent/30 p-5 text-center md:p-6">
            <UserAvatar name={user.name} url={user.avatarUrl} size={64} className="mx-auto" />
            <div className="mt-3 font-[family-name:var(--font-syne)] text-lg font-bold text-[#f5e6c8]">
              {user.name}
            </div>
            <div className="mt-1 text-sm text-accent">{user.title || "Фрилансер"}</div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-border bg-panel-soft/50 px-3 py-3">
                <div className="font-[family-name:var(--font-syne)] text-xl font-bold text-text">
                  {user.rating.toFixed(1)}
                </div>
                <div className="mt-1 text-[11px] text-muted">рейтинг</div>
              </div>
              <div className="rounded-xl border border-border bg-panel-soft/50 px-3 py-3">
                <div className="font-[family-name:var(--font-syne)] text-xl font-bold text-text">
                  {portfolio.length}
                </div>
                <div className="mt-1 text-[11px] text-muted">кейсы</div>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              <ButtonLink
                href="/client/projects/new"
                className="!w-full !rounded-full !py-2.5 !text-sm"
              >
                Предложить проект
              </ButtonLink>
              <ButtonLink
                href={basePath}
                variant="ghost"
                className="!w-full !rounded-full !py-2.5 !text-sm"
              >
                К каталогу
              </ButtonLink>
            </div>
            <p className="mt-4 inline-flex items-center justify-center gap-1.5 text-[11px] text-muted">
              <ShieldCheck size={12} className="text-accent" />
              Оплата через эскроу USDT
            </p>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Crown, ExternalLink, Star } from "lucide-react";
import { PortfolioGallery } from "@/components/PortfolioGallery";
import { UserAvatar } from "@/components/UserAvatar";
import { ButtonLink, Chip, PageTitle, Panel } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { listDealsForUser, listPortfolio, listReviewsForUser } from "@/lib/store";

const TABS = [
  { id: "info", label: "Информация" },
  { id: "portfolio", label: "Портфолио" },
  { id: "reviews", label: "Отзывы" },
  { id: "activity", label: "Активность" },
] as const;

type TabId = (typeof TABS)[number]["id"];

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

function casesLabel(n: number) {
  if (n === 1) return "1 кейс в каталоге";
  if (n >= 2 && n <= 4) return `${n} кейса в каталоге`;
  return `${n} кейсов в каталоге`;
}

export default async function FreelancerPublicPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireUser(["freelancer"]);
  const { tab: tabRaw } = await searchParams;
  const tab = (TABS.some((t) => t.id === tabRaw) ? tabRaw : "info") as TabId;

  const portfolio = await listPortfolio(user.id);
  const reviews = await listReviewsForUser(user.id);
  const deals = (await listDealsForUser(user.id)).filter((d) => d.freelancerId === user.id);
  const released = deals.filter((d) => d.status === "released").length;
  const activeDeals = deals.filter((d) =>
    ["funded", "in_progress", "delivered", "disputed"].includes(d.status),
  ).length;
  const primeActive =
    Boolean(user.digiPrimeUntil) &&
    new Date(user.digiPrimeUntil!).getTime() > Date.now();

  const publicHref = `/freelancers/${user.id}`;
  const skills = user.skills.length > 0 ? user.skills : ["Добавьте навыки в личных данных"];

  return (
    <div className="space-y-5">
      <PageTitle
        title="Профиль фрилансера"
        subtitle={`Так видят заказчики · ${casesLabel(portfolio.length)}`}
        className="mb-0"
        action={
          <ButtonLink href="/freelancer/profile" className="!rounded-full !px-5 !py-2.5 !text-sm">
            Обновить профиль
          </ButtonLink>
        }
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const on = tab === t.id;
          const label =
            t.id === "portfolio"
              ? `Портфолио (${portfolio.length})`
              : t.id === "reviews"
                ? `Отзывы (${reviews.length})`
                : t.label;
          return (
            <Link
              key={t.id}
              href={t.id === "info" ? "/freelancer/public" : `/freelancer/public?tab=${t.id}`}
              className={`rounded-full px-3.5 py-2 text-[13px] transition ${
                on
                  ? "border border-accent/45 bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] font-semibold text-accent"
                  : "text-muted hover:text-text"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.75fr)]">
        <div className="min-w-0 space-y-4">
          {tab === "info" && (
            <>
              <Panel className="p-5 md:p-6">
                <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-[#f5e6c8]">
                  Специализация
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {user.title?.trim() || "Укажите должность в личных данных — она видна в каталоге."}
                </p>
              </Panel>

              <Panel className="p-5 md:p-6">
                <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-[#f5e6c8]">
                  Теги
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <Chip key={s}>{s}</Chip>
                  ))}
                </div>
              </Panel>

              <Panel className="p-5 md:p-6">
                <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-[#f5e6c8]">
                  Резюме
                </h2>
                <div className="mt-4 rounded-xl border border-border bg-[#120d0ad9] px-4 py-3.5 text-sm leading-relaxed text-muted">
                  {user.bio?.trim() ||
                    "Расскажите о себе в личных данных — этот текст увидят заказчики в каталоге."}
                </div>
              </Panel>

              <Panel className="p-5 md:p-6">
                <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-[#f5e6c8]">
                  Навыки и умения
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {skills.slice(0, 9).map((s) => (
                    <div
                      key={s}
                      className="rounded-xl border border-border bg-panel-soft/60 px-4 py-3 text-sm text-muted-2"
                    >
                      {s}
                    </div>
                  ))}
                </div>
              </Panel>
            </>
          )}

          {tab === "portfolio" &&
            (portfolio.length === 0 ? (
              <Panel className="p-8 text-center">
                <p className="text-text">Пока нет кейсов</p>
                <p className="mt-2 text-sm text-muted">Добавьте работы — так профиль выглядит сильнее</p>
                <div className="mt-5">
                  <ButtonLink href="/freelancer/portfolio" className="!rounded-full !px-5 !py-2.5 !text-sm">
                    Перейти в портфолио
                  </ButtonLink>
                </div>
              </Panel>
            ) : (
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
            ))}

          {tab === "reviews" &&
            (reviews.length === 0 ? (
              <Panel className="p-8 text-center">
                <p className="text-text">Пока нет отзывов</p>
                <p className="mt-2 text-sm text-muted">Они появятся после завершённых сделок</p>
              </Panel>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <Panel key={r.id} className="p-5">
                    <div className="flex items-center gap-1 text-accent">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < r.rating ? "fill-accent text-accent" : "text-border"}
                        />
                      ))}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-2">{r.text}</p>
                    <p className="mt-3 text-xs text-muted">
                      {new Date(r.createdAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </Panel>
                ))}
              </div>
            ))}

          {tab === "activity" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Panel className="p-5">
                <div className="text-xs uppercase tracking-wider text-muted">Сделок всего</div>
                <div className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold text-[#f5e6c8]">
                  {deals.length}
                </div>
              </Panel>
              <Panel className="p-5">
                <div className="text-xs uppercase tracking-wider text-muted">Завершено</div>
                <div className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold text-[#f5e6c8]">
                  {released}
                </div>
              </Panel>
              <Panel className="p-5">
                <div className="text-xs uppercase tracking-wider text-muted">Сейчас в работе</div>
                <div className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold text-[#f5e6c8]">
                  {activeDeals}
                </div>
              </Panel>
              <Panel className="p-5">
                <div className="text-xs uppercase tracking-wider text-muted">Кейсов</div>
                <div className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold text-[#f5e6c8]">
                  {portfolio.length}
                </div>
              </Panel>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <Panel className="overflow-hidden border-accent/35 p-5 text-center md:p-6">
            <div className="mx-auto flex justify-center">
              <UserAvatar name={user.name} url={user.avatarUrl} size={72} />
            </div>
            <div className="mt-4 flex items-center justify-center gap-1.5">
              <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-[#f5e6c8]">
                {user.name}
              </h2>
              {primeActive && <Crown size={16} className="text-accent" aria-label="Digi Prime" />}
            </div>
            <p className="mt-1 text-sm font-semibold text-accent">
              {user.title?.trim() || "Фрилансер DigiForge"}
            </p>
            {primeActive && (
              <div className="mx-auto mt-3 inline-flex rounded-full border border-accent/45 bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] px-3 py-1.5 text-xs font-semibold text-accent">
                Digi Prime
              </div>
            )}
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-border bg-panel-soft/50 px-2 py-2.5">
                <div className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                  {user.rating.toFixed(1)}
                </div>
                <div className="mt-0.5 text-[10px] text-muted">рейтинг</div>
              </div>
              <div className="rounded-xl border border-border bg-panel-soft/50 px-2 py-2.5">
                <div className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                  {reviews.length || user.reviewCount}
                </div>
                <div className="mt-0.5 text-[10px] text-muted">отзывы</div>
              </div>
              <div className="rounded-xl border border-border bg-panel-soft/50 px-2 py-2.5">
                <div className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                  {portfolio.length}
                </div>
                <div className="mt-0.5 text-[10px] text-muted">кейсы</div>
              </div>
            </div>
            <Link
              href={publicHref}
              target="_blank"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-[#120d0a] transition hover:bg-accent-strong"
            >
              Открыть в каталоге
              <ExternalLink size={14} />
            </Link>
          </Panel>

          <Panel className="p-5">
            <h3 className="font-[family-name:var(--font-syne)] text-base font-bold text-[#f5e6c8]">
              Показатели
            </h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Рейтинг</dt>
                <dd className="font-semibold text-text">{user.rating.toFixed(1)} ★</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Отзывы</dt>
                <dd className="font-semibold text-text">{reviews.length || user.reviewCount}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Завершённые сделки</dt>
                <dd className="font-semibold text-text">{released}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">В работе</dt>
                <dd className="font-semibold text-text">{activeDeals}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Кейсы</dt>
                <dd className="font-semibold text-text">{portfolio.length}</dd>
              </div>
            </dl>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

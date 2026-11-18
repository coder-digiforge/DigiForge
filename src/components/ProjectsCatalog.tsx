import Link from "next/link";
import {
  Clock3,
  EyeOff,
  Gavel,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { Button, ButtonLink, EmptyState, Panel } from "@/components/ui";
import {
  buildProjectCatalogHref,
  filterAndSortProjects,
  formatPostedAgo,
  matchScore,
  parseProjectCatalogQuery,
  PROJECT_CATEGORIES,
  type ProjectCatalogQuery,
} from "@/lib/project-catalog";
import { getDb, listProjects } from "@/lib/store";

function ChipLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3.5 py-1.5 text-sm transition ${
        active
          ? "bg-accent font-semibold text-[#1a120c]"
          : "border border-border text-muted hover:border-accent/40 hover:text-text"
      }`}
    >
      {children}
    </Link>
  );
}

export async function ProjectsCatalog({
  basePath = "/projects",
  detailBasePath,
  variant = "public",
  searchParams = {},
  viewerSkills = [],
  viewerBidProjectIds = [],
}: {
  basePath?: string;
  detailBasePath?: string;
  variant?: "public" | "cabinet";
  searchParams?: Record<string, string | string[] | undefined>;
  viewerSkills?: string[];
  viewerBidProjectIds?: string[];
}) {
  const query = parseProjectCatalogQuery(searchParams);
  const detailBase = detailBasePath ?? basePath;
  const projects = await listProjects();
  const db = await getDb();
  const openAll = projects.filter((p) => p.status === "open");

  const rowsRaw = openAll.map((project) => {
    const client = db.users.find((u) => u.id === project.clientId);
    const bidCount = db.bids.filter((b) => b.projectId === project.id).length;
    const myBid = viewerBidProjectIds.includes(project.id);
    return {
      project,
      client,
      bidCount,
      myBid,
      score: matchScore(project, viewerSkills),
    };
  });

  const rows = filterAndSortProjects(rowsRaw, query, viewerSkills);

  const avgBudget =
    openAll.length === 0
      ? 0
      : Math.round(
          openAll.reduce((s, p) => s + (p.budgetMin + p.budgetMax) / 2, 0) / openAll.length,
        );
  const hiddenCount = openAll.filter((p) => p.bidsHidden).length;
  const matchedCount = rowsRaw.filter((r) => r.score > 0).length;

  const href = (patch: Partial<ProjectCatalogQuery> = {}) =>
    buildProjectCatalogHref(basePath, query, patch);

  const shellClass =
    variant === "public" ? "mx-auto max-w-[1440px] px-6 py-12 md:px-12" : "space-y-6";

  const hasFilters = Boolean(
    query.q ||
      query.category ||
      (query.sort && query.sort !== "newest") ||
      (query.deadline && query.deadline !== "any") ||
      (query.bids && query.bids !== "any") ||
      (query.budget && query.budget !== "any") ||
      query.budgetMin ||
      query.budgetMax ||
      query.free,
  );

  return (
    <div className={shellClass}>
      <section className="relative overflow-hidden rounded-3xl border border-border bg-[linear-gradient(135deg,#2a2118_0%,#1a1511_55%,#14100d_100%)] px-6 py-8 md:px-10 md:py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(224,168,107,0.28),transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-1/4 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(224,168,107,0.12),transparent_70%)]"
        />
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(224,168,107,0.3)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] px-3 py-1 text-xs font-semibold text-accent">
            <ShieldCheck size={14} />
            Эскроу · бюджет в USDT
          </div>
          <h1 className="mt-4 font-[family-name:var(--font-syne)] text-3xl font-bold leading-tight text-[#f5e6c8] md:text-4xl">
            Найти проект
          </h1>
          <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-muted md:text-base">
            Открытые заказы DigiForge. Фильтруйте по категории, бюджету и сроку — ставка уходит
            заказчику, оплата остаётся в сейфе до приёмки.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {variant === "cabinet" ? (
              <>
                <ButtonLink href="/freelancer/bids" className="!rounded-full !px-5 !py-2.5 !text-sm">
                  Мои ставки
                </ButtonLink>
                <ButtonLink
                  href={href({ sort: "match" })}
                  variant="ghost"
                  className="!rounded-full !px-5 !py-2.5 !text-sm"
                >
                  Подбор под навыки
                </ButtonLink>
              </>
            ) : (
              <>
                <ButtonLink href="/register" className="!rounded-full !px-5 !py-2.5 !text-sm">
                  Стать исполнителем
                </ButtonLink>
                <ButtonLink
                  href="/login"
                  variant="ghost"
                  className="!rounded-full !px-5 !py-2.5 !text-sm"
                >
                  Войти в кабинет
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      </section>

      <div className={`${variant === "public" ? "mt-6" : ""} grid gap-3 sm:grid-cols-2 xl:grid-cols-4`}>
        <div className="rounded-2xl border border-border bg-panel px-4 py-4">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Search size={14} className="text-accent" />
            Открыто
          </div>
          <div className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-text">
            {openAll.length}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-panel px-4 py-4">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Wallet size={14} className="text-accent" />
            Средний бюджет
          </div>
          <div className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-text">
            {avgBudget.toLocaleString("ru-RU")}
            <span className="ml-1 text-sm font-semibold text-muted">USDT</span>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-panel px-4 py-4">
          <div className="flex items-center gap-2 text-xs text-muted">
            <EyeOff size={14} className="text-accent" />
            Ставки скрыты
          </div>
          <div className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-text">
            {hiddenCount}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-panel px-4 py-4">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Sparkles size={14} className="text-accent" />
            Под ваши навыки
          </div>
          <div className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-text">
            {viewerSkills.length ? matchedCount : "—"}
          </div>
        </div>
      </div>

      <Panel className={`${variant === "public" ? "mt-6" : ""} p-4 md:p-5`}>
        <form method="get" action={basePath} className="space-y-4">
          {query.category && <input type="hidden" name="category" value={query.category} />}
          {query.deadline && query.deadline !== "any" && (
            <input type="hidden" name="deadline" value={query.deadline} />
          )}
          {query.bids && query.bids !== "any" && (
            <input type="hidden" name="bids" value={query.bids} />
          )}
          {query.budget && query.budget !== "any" && (
            <input type="hidden" name="budget" value={query.budget} />
          )}
          {query.free && <input type="hidden" name="free" value="1" />}

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1">
              <label className="mb-1.5 block text-xs font-medium text-muted">Поиск</label>
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  name="q"
                  defaultValue={query.q ?? ""}
                  placeholder="Название, описание, категория…"
                  className="df-input !pl-10"
                />
              </div>
            </div>
            <div className="w-full lg:w-52">
              <label className="mb-1.5 block text-xs font-medium text-muted">Сортировка</label>
              <select name="sort" defaultValue={query.sort ?? "newest"} className="df-input">
                <option value="newest">Сначала новые</option>
                <option value="budget_desc">Бюджет · по убыванию</option>
                <option value="budget_asc">Бюджет · по возрастанию</option>
                <option value="deadline_asc">Срок · короче</option>
                <option value="bids_asc">Меньше ставок</option>
                {viewerSkills.length > 0 && <option value="match">Под ваши навыки</option>}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" className="!rounded-full !px-5">
                Найти
              </Button>
              {hasFilters && (
                <ButtonLink href={basePath} variant="ghost" className="!rounded-full !px-4">
                  Сбросить
                </ButtonLink>
              )}
            </div>
          </div>

          {variant === "cabinet" && (
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted-2">
              <input
                type="checkbox"
                name="free"
                value="1"
                defaultChecked={query.free}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              Только без моей ставки
            </label>
          )}
        </form>

        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium uppercase tracking-wider text-muted">
              Категория
            </span>
            <ChipLink href={href({ category: undefined })} active={!query.category}>
              Все
            </ChipLink>
            {PROJECT_CATEGORIES.map((c) => (
              <ChipLink key={c} href={href({ category: c })} active={query.category === c}>
                {c}
              </ChipLink>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium uppercase tracking-wider text-muted">
              Бюджет
            </span>
            {(
              [
                ["any", "Любой"],
                ["lt1k", "до 1k"],
                ["1to2k", "1–2k"],
                ["gte2k", "от 2k"],
              ] as const
            ).map(([id, label]) => (
              <ChipLink
                key={id}
                href={href({ budget: id === "any" ? undefined : id })}
                active={(query.budget ?? "any") === id}
              >
                {label}
              </ChipLink>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium uppercase tracking-wider text-muted">
              Срок
            </span>
            {(
              [
                ["any", "Любой"],
                ["week", "до 7 дн."],
                ["two_weeks", "до 14 дн."],
                ["month", "до 30 дн."],
              ] as const
            ).map(([id, label]) => (
              <ChipLink
                key={id}
                href={href({ deadline: id === "any" ? undefined : id })}
                active={(query.deadline ?? "any") === id}
              >
                {label}
              </ChipLink>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium uppercase tracking-wider text-muted">
              Ставки
            </span>
            {(
              [
                ["any", "Все"],
                ["open", "Открытые"],
                ["hidden", "Скрытые"],
              ] as const
            ).map(([id, label]) => (
              <ChipLink
                key={id}
                href={href({ bids: id === "any" ? undefined : id })}
                active={(query.bids ?? "any") === id}
              >
                {label}
              </ChipLink>
            ))}
          </div>
        </div>
      </Panel>

      <div
        className={`${variant === "public" ? "mt-6" : ""} flex flex-wrap items-baseline justify-between gap-2`}
      >
        <p className="text-sm text-muted">
          Найдено{" "}
          <span className="font-semibold text-text">{rows.length}</span>
          {hasFilters ? " по фильтрам" : " открытых проектов"}
        </p>
        {query.sort === "match" && (
          <p className="text-xs text-accent">Сортировка · под ваши навыки</p>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Ничего не нашли"
          hint={
            hasFilters
              ? "Смягчите фильтры или сбросьте поиск"
              : "Скоро появятся новые открытые заказы"
          }
        />
      ) : (
        <div className="grid gap-3">
          {rows.map(({ project: p, client, bidCount, myBid, score }) => (
            <Link key={p.id} href={`${detailBase}/${p.id}`} className="group block">
              <Panel className="p-5 transition-colors group-hover:border-accent/45 md:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {score > 0 && variant === "cabinet" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] px-2.5 py-0.5 text-[11px] font-semibold text-accent">
                          <Sparkles size={11} />
                          Подходит вам
                        </span>
                      )}
                      {myBid && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-[11px] font-semibold text-muted-2">
                          <Gavel size={11} />
                          Ваша ставка
                        </span>
                      )}
                      {p.bidsHidden && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-[11px] font-semibold text-muted">
                          <EyeOff size={11} />
                          Ставки скрыты
                        </span>
                      )}
                      <span className="text-xs text-muted">{formatPostedAgo(p.createdAt)}</span>
                    </div>

                    <h2 className="mt-2 font-[family-name:var(--font-syne)] text-xl font-bold text-text transition-colors group-hover:text-accent">
                      {p.title}
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted line-clamp-2">
                      {p.description}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-border bg-panel-soft px-2.5 py-1 text-[11px] font-medium text-muted-2">
                        {p.category}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted">
                        <Clock3 size={12} />
                        {p.deadlineDays} дн.
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted">
                        <Gavel size={12} />
                        {p.bidsHidden ? "ставки скрыты" : `${bidCount} ставок`}
                      </span>
                    </div>

                    {client && (
                      <div className="mt-4 flex items-center gap-2.5">
                        <UserAvatar name={client.name} url={client.avatarUrl} size={28} />
                        <div className="min-w-0 text-sm">
                          <span className="font-medium text-text">{client.name}</span>
                          <span className="text-muted">
                            {" "}
                            · заказчик
                            {client.reviewCount > 0
                              ? ` · ★ ${client.rating.toFixed(1)}`
                              : ""}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 text-left lg:min-w-[160px] lg:text-right">
                    <div className="font-[family-name:var(--font-syne)] text-xl font-bold text-accent">
                      {p.budgetMin.toLocaleString("ru-RU")}–{p.budgetMax.toLocaleString("ru-RU")}
                    </div>
                    <div className="text-xs text-muted">USDT · эскроу</div>
                    <div className="mt-4 text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100 lg:opacity-100">
                      {myBid ? "Открыть проект →" : "Смотреть и ставить →"}
                    </div>
                  </div>
                </div>
              </Panel>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

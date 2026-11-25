import Link from "next/link";
import {
  ArrowLeft,
  EyeOff,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import {
  ProjectCatalogBoard,
  type ProjectCatalogItem,
} from "@/components/ProjectCatalogBoard";
import { Button, ButtonLink } from "@/components/ui";
import {
  buildProjectCatalogHref,
  filterAndSortProjects,
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
  block = false,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  block?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`${block ? "block w-full px-3 py-2 text-left" : "px-3.5 py-1.5"} rounded-xl text-sm transition ${
        active
          ? "bg-accent font-semibold text-[#1a120c]"
          : "border border-border text-muted hover:border-accent/40 hover:text-text"
      }`}
    >
      {children}
    </Link>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted">
        {title}
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

export async function ProjectsCatalog({
  basePath = "/projects",
  variant = "public",
  searchParams = {},
  viewerSkills = [],
  viewerId,
}: {
  basePath?: string;
  detailBasePath?: string;
  variant?: "public" | "cabinet";
  searchParams?: Record<string, string | string[] | undefined>;
  viewerSkills?: string[];
  viewerBidProjectIds?: string[];
  viewerId?: string;
}) {
  const query = parseProjectCatalogQuery(searchParams);
  const projects = await listProjects();
  const db = await getDb();
  const openAll = projects.filter((p) => p.status === "open");

  const rowsRaw: (ProjectCatalogItem & { hasMyBid: boolean })[] = openAll.map((project) => {
    const clientUser = db.users.find((u) => u.id === project.clientId);
    const projectBids = db.bids
      .filter((b) => b.projectId === project.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const myBidRow = viewerId
      ? projectBids.find((b) => b.freelancerId === viewerId) ?? null
      : null;

    const bids = project.bidsHidden
      ? []
      : projectBids.map((b) => {
          const f = db.users.find((u) => u.id === b.freelancerId);
          const prime = Boolean(
            f?.digiPrimeUntil && new Date(f.digiPrimeUntil).getTime() > Date.now(),
          );
          return {
            id: b.id,
            amount: b.amount,
            days: b.days,
            comment: b.comment,
            status: b.status,
            createdAt: b.createdAt,
            freelancer: {
              id: f?.id ?? b.freelancerId,
              name: f?.name ?? "Фрилансер",
              avatarUrl: f?.avatarUrl,
              title: f?.title,
              rating: f?.rating ?? 0,
              reviewCount: f?.reviewCount ?? 0,
              prime,
            },
          };
        });

    const discussions = (db.projectComments ?? [])
      .filter((c) => c.projectId === project.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((c) => {
        const author = db.users.find((u) => u.id === c.authorId);
        return {
          id: c.id,
          parentId: c.parentId ?? null,
          body: c.body,
          createdAt: c.createdAt,
          thanksCount: c.thanksCount ?? 0,
          thankedByMe: Boolean(
            viewerId && (c.thankedBy ?? []).includes(viewerId),
          ),
          author: {
            id: author?.id ?? c.authorId,
            name: author?.name ?? "Участник",
            avatarUrl: author?.avatarUrl,
            title: author?.title,
            role: author?.role,
          },
        };
      });

    const projectsCount = db.projects.filter((p) => p.clientId === project.clientId).length;
    const views = 80 + ((project.id.charCodeAt(project.id.length - 1) * 17) % 220);

    return {
      project,
      client: clientUser
        ? {
            id: clientUser.id,
            name: clientUser.name,
            avatarUrl: clientUser.avatarUrl,
            title: clientUser.title,
            rating: clientUser.rating,
            reviewCount: clientUser.reviewCount,
            projectsCount,
          }
        : null,
      bidCount: projectBids.length,
      bids,
      discussions,
      views,
      myBid: myBidRow
        ? {
            id: myBidRow.id,
            amount: myBidRow.amount,
            days: myBidRow.days,
            comment: myBidRow.comment,
            status: myBidRow.status,
          }
        : null,
      favorited: Boolean(
        viewerId &&
          db.favorites?.some(
            (f) =>
              f.userId === viewerId &&
              f.targetType === "project" &&
              f.targetId === project.id,
          ),
      ),
      hasMyBid: Boolean(myBidRow),
      score: matchScore(project, viewerSkills),
    };
  });

  const rows = filterAndSortProjects(
    rowsRaw.map((r) => ({ ...r, myBid: r.hasMyBid })),
    query,
    viewerSkills,
  ).map((r) => {
    const full = rowsRaw.find((x) => x.project.id === r.project.id)!;
    const { hasMyBid: _hasMyBid, ...item } = full;
    return item;
  });

  const initialProjectRaw = searchParams.project;
  const initialProjectId = Array.isArray(initialProjectRaw)
    ? initialProjectRaw[0]
    : initialProjectRaw;

  const withBudget = openAll.filter((p) => p.budget != null && p.budget > 0);
  const avgBudget =
    withBudget.length === 0
      ? 0
      : Math.round(withBudget.reduce((s, p) => s + (p.budget ?? 0), 0) / withBudget.length);
  const hiddenCount = openAll.filter((p) => p.bidsHidden).length;
  const matchedCount = rowsRaw.filter((r) => r.score > 0).length;

  const href = (patch: Partial<ProjectCatalogQuery> = {}) =>
    buildProjectCatalogHref(basePath, query, patch);

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

  const backHref = variant === "cabinet" ? "/freelancer" : "/";
  const backLabel = variant === "cabinet" ? "В кабинет" : "На главную";

  const filterPanel = (
    <aside className="df-panel h-fit w-full shrink-0 p-4 lg:sticky lg:top-[84px] lg:w-[260px]">
      <Link
        href={backHref}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-accent"
      >
        <ArrowLeft size={14} />
        {backLabel}
      </Link>

      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
          Подбор
        </h2>
        {hasFilters && (
          <Link href={basePath} className="text-xs font-medium text-accent hover:underline">
            Сбросить
          </Link>
        )}
      </div>

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

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Поиск</label>
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              name="q"
              defaultValue={query.q ?? ""}
              placeholder="Название, описание…"
              className="df-input !pl-9 !text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Сортировка</label>
          <select name="sort" defaultValue={query.sort ?? "newest"} className="df-input !text-sm">
            <option value="newest">Сначала новые</option>
            <option value="budget_desc">Бюджет · убывание</option>
            <option value="budget_asc">Бюджет · возрастание</option>
            <option value="deadline_asc">Срок · короче</option>
            <option value="bids_asc">Меньше ставок</option>
            {viewerSkills.length > 0 && <option value="match">Под ваши навыки</option>}
          </select>
        </div>

        {variant === "cabinet" && (
          <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border px-3 py-2.5 text-sm text-muted-2 transition hover:border-accent/35">
            <input
              type="checkbox"
              name="free"
              value="1"
              defaultChecked={query.free}
              className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
            />
            <span>Только без моей ставки</span>
          </label>
        )}

        <Button type="submit" className="w-full !rounded-full">
          Применить
        </Button>
      </form>

      <div className="mt-5 space-y-5 border-t border-border pt-5">
        <FilterGroup title="Категория">
          <ChipLink href={href({ category: undefined })} active={!query.category} block>
            Все категории
          </ChipLink>
          {PROJECT_CATEGORIES.map((c) => (
            <ChipLink key={c} href={href({ category: c })} active={query.category === c} block>
              {c}
            </ChipLink>
          ))}
        </FilterGroup>

        <FilterGroup title="Бюджет">
          {(
            [
              ["any", "Любой"],
              ["none", "Не указан"],
              ["lt1k", "до 1 000 USDT"],
              ["1to2k", "1 000–2 000"],
              ["gte2k", "от 2 000"],
            ] as const
          ).map(([id, label]) => (
            <ChipLink
              key={id}
              href={href({ budget: id === "any" ? undefined : id })}
              active={(query.budget ?? "any") === id}
              block
            >
              {label}
            </ChipLink>
          ))}
        </FilterGroup>

        <FilterGroup title="Срок">
          {(
            [
              ["any", "Любой"],
              ["week", "до 7 дней"],
              ["two_weeks", "до 14 дней"],
              ["month", "до 30 дней"],
            ] as const
          ).map(([id, label]) => (
            <ChipLink
              key={id}
              href={href({ deadline: id === "any" ? undefined : id })}
              active={(query.deadline ?? "any") === id}
              block
            >
              {label}
            </ChipLink>
          ))}
        </FilterGroup>

        <FilterGroup title="Ставки">
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
              block
            >
              {label}
            </ChipLink>
          ))}
        </FilterGroup>

        {variant === "cabinet" && viewerSkills.length > 0 && (
          <ButtonLink
            href={href({ sort: "match" })}
            variant="ghost"
            className="w-full !rounded-full !text-sm"
          >
            <span className="inline-flex items-center gap-1.5">
              <Sparkles size={14} />
              Подбор под навыки
            </span>
          </ButtonLink>
        )}
      </div>
    </aside>
  );

  const stats = (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
  );

  const results = (
    <ProjectCatalogBoard
      items={rows}
      variant={variant}
      hasFilters={hasFilters}
      sortMatch={query.sort === "match"}
      initialProjectId={initialProjectId}
    />
  );

  if (variant === "cabinet") {
    return (
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
        {filterPanel}
        <div className="min-w-0 flex-1 space-y-5">
          <section className="relative overflow-hidden rounded-3xl border border-border bg-[linear-gradient(135deg,#2a2118_0%,#1a1511_55%,#14100d_100%)] px-5 py-6 md:px-8 md:py-7">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(224,168,107,0.26),transparent_70%)]"
            />
            <div className="relative flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(224,168,107,0.3)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] px-3 py-1 text-xs font-semibold text-accent">
                  <ShieldCheck size={14} />
                  Эскроу · бюджет в USDT
                </div>
                <h1 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-bold leading-tight text-[#f5e6c8]">
                  Найти проект
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Подбор слева · ставки и эскроу справа. Оплата в сейфе до приёмки.
                </p>
              </div>
              <ButtonLink href="/freelancer/bids" variant="ghost" className="!rounded-full !text-sm">
                Мои ставки
              </ButtonLink>
            </div>
          </section>
          {stats}
          {results}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-12 md:px-12">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-[linear-gradient(135deg,#2a2118_0%,#1a1511_55%,#14100d_100%)] px-6 py-8 md:px-10 md:py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(224,168,107,0.28),transparent_70%)]"
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
          </div>
        </div>
      </section>

      <div className="mt-6">{stats}</div>

      <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
        {filterPanel}
        <div className="min-w-0 flex-1 space-y-5">{results}</div>
      </div>
    </div>
  );
}

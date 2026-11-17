import Link from "next/link";
import { Crown, Search, ShieldCheck, Star, Users } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { ButtonLink, EmptyState, Panel } from "@/components/ui";
import { getDb, listFreelancers } from "@/lib/store";

function isPrime(until?: string | null) {
  return Boolean(until) && new Date(until!).getTime() > Date.now();
}

export async function FreelancersCatalog({
  basePath = "/freelancers",
  skillFilter = null,
  variant = "public",
}: {
  basePath?: string;
  skillFilter?: string | null;
  variant?: "public" | "cabinet";
}) {
  const freelancers = await listFreelancers();
  const db = await getDb();

  const allSkills = Array.from(
    new Set(freelancers.flatMap((f) => f.skills).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b, "ru"));

  const rows = freelancers
    .filter((f) => (skillFilter ? f.skills.includes(skillFilter) : true))
    .map((f) => ({
      user: f,
      prime: isPrime(f.digiPrimeUntil),
      cases: db.portfolio.filter((c) => c.freelancerId === f.id).length,
    }))
    .sort((a, b) => {
      if (a.prime !== b.prime) return a.prime ? -1 : 1;
      return b.user.rating - a.user.rating;
    });

  const primeCount = freelancers.filter((f) => isPrime(f.digiPrimeUntil)).length;
  const shellClass =
    variant === "public" ? "mx-auto max-w-[1440px] px-6 py-12 md:px-12" : "space-y-6";

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
            Оплата через эскроу · USDT
          </div>
          <h1 className="mt-4 font-[family-name:var(--font-syne)] text-3xl font-bold leading-tight text-[#f5e6c8] md:text-4xl">
            Исполнители
          </h1>
          <p className="mt-3 max-w-[48ch] text-sm leading-relaxed text-muted md:text-base">
            Каталог фрилансеров DigiForge. Выбирайте по навыкам и рейтингу — бюджет останется в
            сейфе до приёмки работы.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href="/client/projects/new" className="!rounded-full !px-5 !py-2.5 !text-sm">
              Опубликовать проект
            </ButtonLink>
            {variant === "public" && (
              <ButtonLink
                href="/login"
                variant="ghost"
                className="!rounded-full !px-5 !py-2.5 !text-sm"
              >
                Войти в кабинет
              </ButtonLink>
            )}
            {variant === "cabinet" && (
              <ButtonLink
                href="/client/projects"
                variant="ghost"
                className="!rounded-full !px-5 !py-2.5 !text-sm"
              >
                Мои проекты
              </ButtonLink>
            )}
          </div>
        </div>
      </section>

      <div className={`${variant === "public" ? "mt-6" : ""} grid gap-3 sm:grid-cols-3`}>
        <div className="rounded-2xl border border-border bg-panel px-4 py-4">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Users size={14} className="text-accent" />
            В каталоге
          </div>
          <div className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-text">
            {freelancers.length}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-panel px-4 py-4">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Crown size={14} className="text-accent" />
            Digi Prime
          </div>
          <div className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-text">
            {primeCount}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-panel px-4 py-4">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Search size={14} className="text-accent" />
            Навыков
          </div>
          <div className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-text">
            {allSkills.length}
          </div>
        </div>
      </div>

      {allSkills.length > 0 && (
        <div className={`${variant === "public" ? "mt-6" : ""} flex flex-wrap items-center gap-2`}>
          <Link
            href={basePath}
            className={`rounded-full px-3.5 py-1.5 text-sm transition ${
              !skillFilter
                ? "bg-accent font-semibold text-[#1a120c]"
                : "border border-border text-muted hover:border-accent/40 hover:text-text"
            }`}
          >
            Все
          </Link>
          {allSkills.map((s) => {
            const on = skillFilter === s;
            return (
              <Link
                key={s}
                href={`${basePath}?skill=${encodeURIComponent(s)}`}
                className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                  on
                    ? "bg-accent font-semibold text-[#1a120c]"
                    : "border border-border text-muted hover:border-accent/40 hover:text-text"
                }`}
              >
                {s}
              </Link>
            );
          })}
        </div>
      )}

      {rows.length === 0 ? (
        <div className={variant === "public" ? "mt-8" : ""}>
          <EmptyState
            title="Никого не нашли"
            hint={skillFilter ? `По навыку «${skillFilter}» пока пусто` : "Каталог пока пуст"}
          />
        </div>
      ) : (
        <div
          className={`${variant === "public" ? "mt-8" : ""} grid gap-4 sm:grid-cols-2 xl:grid-cols-3`}
        >
          {rows.map(({ user: f, prime, cases }) => (
            <Link key={f.id} href={`${basePath}/${f.id}`} className="group block h-full">
              <Panel className="flex h-full flex-col overflow-hidden p-0 transition-colors group-hover:border-accent/45">
                <div className="relative border-b border-border bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_12%,transparent)_0%,transparent_55%)] px-5 pb-5 pt-5">
                  {prime && (
                    <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] px-2.5 py-1 text-[11px] font-semibold text-accent">
                      <Crown size={12} />
                      Prime
                    </span>
                  )}
                  <div className="flex items-center gap-3.5">
                    <UserAvatar name={f.name} url={f.avatarUrl} size={56} />
                    <div className="min-w-0 pr-16">
                      <div className="truncate font-[family-name:var(--font-syne)] text-lg font-bold text-text transition-colors group-hover:text-accent">
                        {f.name}
                      </div>
                      <div className="mt-0.5 truncate text-sm text-accent">
                        {f.title || "Фрилансер"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="inline-flex items-center gap-1 font-semibold text-text">
                      <Star size={14} className="fill-accent text-accent" />
                      {f.rating.toFixed(1)}
                    </span>
                    <span className="text-muted">{f.reviewCount} отзывов</span>
                    <span className="text-muted">·</span>
                    <span className="text-muted">{cases} кейсов</span>
                  </div>

                  <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">
                    {f.bio || "Профиль в разработке — скоро появятся детали и кейсы."}
                  </p>

                  {f.skills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {f.skills.slice(0, 5).map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-border bg-panel-soft px-2.5 py-1 text-[11px] font-medium text-muted-2"
                        >
                          {s}
                        </span>
                      ))}
                      {f.skills.length > 5 && (
                        <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted">
                          +{f.skills.length - 5}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-5 text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                    Смотреть профиль →
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

import Link from "next/link";
import { Briefcase, ShieldCheck, Star, Wallet } from "lucide-react";
import { ButtonLink, PageTitle, Panel } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getProfileCompletion } from "@/lib/profileCompletion";
import {
  getBalances,
  listBidsForFreelancer,
  listDealsForUser,
  listNotifications,
  listPortfolio,
} from "@/lib/store";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.floor(diff / 60000));
  if (mins < 60) return `${mins} мин. назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч. назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн. назад`;
}

function CompletionRing({ percent }: { percent: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

  return (
    <div className="relative grid h-[108px] w-[108px] shrink-0 place-items-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="color-mix(in srgb, var(--accent) 14%, transparent)"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="font-[family-name:var(--font-syne)] text-xl font-bold text-text">
          {percent}%
        </span>
      </div>
    </div>
  );
}

export default async function FreelancerCabinetPage() {
  const user = await requireUser(["freelancer"]);
  const bids = await listBidsForFreelancer(user.id);
  const deals = (await listDealsForUser(user.id)).filter((d) => d.freelancerId === user.id);
  const activeDeals = deals.filter((d) =>
    ["funded", "in_progress", "delivered", "disputed"].includes(d.status),
  );
  const bal = await getBalances(user.id);
  const notes = (await listNotifications(user.id)).slice(0, 8);
  const portfolio = await listPortfolio(user.id);
  const completion = getProfileCompletion({
    email: user.email,
    avatarUrl: user.avatarUrl,
    title: user.title,
    bio: user.bio,
    skills: user.skills,
    walletAddress: user.walletAddress,
    portfolioCount: portfolio.length,
  });
  const primeActive =
    user.digiPrimeUntil && new Date(user.digiPrimeUntil).getTime() > Date.now();

  return (
    <div className="space-y-6">
      <Panel className="p-6 md:p-8">
        <PageTitle
          title="Кабинет"
          subtitle={`Привет, ${user.name}`}
          action={<ButtonLink href="/freelancer/projects">Найти проект</ButtonLink>}
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.9fr)]">
          {/* Left column */}
          <div className="space-y-5">
            <section className="relative overflow-hidden rounded-2xl border border-border bg-[linear-gradient(135deg,#2a2118_0%,#1a1511_55%,#14100d_100%)] p-6 md:p-7">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(224,168,107,0.28),transparent_70%)]"
              />
              <div className="relative max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(224,168,107,0.3)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] px-3 py-1 text-xs font-semibold text-accent">
                  <ShieldCheck size={14} />
                  Эскроу · USDT
                </div>
                <h2 className="mt-4 font-[family-name:var(--font-syne)] text-2xl font-bold leading-snug text-text md:text-[1.7rem]">
                  Безопасные сделки без предоплаты «на слово»
                </h2>
                <p className="mt-3 max-w-[40ch] text-sm leading-relaxed text-muted">
                  Деньги клиента в сейфе до приёмки. Комиссия DigiForge — 10%, без подписок и
                  скрытых платежей.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <ButtonLink href="/freelancer/projects" className="!rounded-full !px-5 !py-2.5 !text-sm">
                    Смотреть проекты
                  </ButtonLink>
                  <ButtonLink
                    href="/freelancer/prime"
                    variant="ghost"
                    className="!rounded-full !px-5 !py-2.5 !text-sm"
                  >
                    {primeActive ? "Digi Prime активен" : "Подключить Digi Prime"}
                  </ButtonLink>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-panel p-5 md:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-text">
                  Лента
                </h2>
                <Link href="/freelancer/projects" className="text-xs text-accent hover:underline">
                  К проектам
                </Link>
              </div>
              {notes.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">Пока тихо — загляните в маркетплейс</p>
              ) : (
                <ul className="space-y-1">
                  {notes.map((n) => (
                    <li key={n.id}>
                      <Link
                        href={n.href ?? "/freelancer"}
                        className="flex items-start gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]"
                      >
                        <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-panel-soft text-xs font-semibold text-accent">
                          {n.title.slice(0, 1)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] text-muted">{timeAgo(n.createdAt)}</div>
                          <div className="mt-0.5 text-sm text-text">
                            <span className="font-semibold">{n.title}</span>
                            <span className="text-muted"> — {n.body}</span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            <section className="rounded-2xl border border-border bg-panel p-5">
              <h2 className="mb-4 font-[family-name:var(--font-syne)] text-lg font-semibold text-text">
                Мои показатели
              </h2>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-panel-soft/80 px-2 py-4">
                  <Briefcase className="mx-auto text-accent" size={18} />
                  <div className="mt-2 font-[family-name:var(--font-syne)] text-xl font-bold text-text">
                    {deals.length}
                  </div>
                  <div className="mt-1 text-[11px] text-muted">Сделки</div>
                </div>
                <div className="rounded-xl bg-panel-soft/80 px-2 py-4">
                  <Star className="mx-auto text-accent" size={18} />
                  <div className="mt-2 font-[family-name:var(--font-syne)] text-xl font-bold text-text">
                    {user.rating.toFixed(1)}
                  </div>
                  <div className="mt-1 text-[11px] text-muted">Рейтинг</div>
                </div>
                <div className="rounded-xl bg-panel-soft/80 px-2 py-4">
                  <Wallet className="mx-auto text-accent" size={18} />
                  <div className="mt-2 font-[family-name:var(--font-syne)] text-xl font-bold text-text">
                    {bal.available}
                  </div>
                  <div className="mt-1 text-[11px] text-muted">USDT</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted">
                <div className="rounded-lg border border-border px-3 py-2">
                  Ставки: <span className="text-text">{bids.length}</span>
                </div>
                <div className="rounded-lg border border-border px-3 py-2">
                  В работе: <span className="text-text">{activeDeals.length}</span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-panel p-5">
              <h2 className="mb-4 font-[family-name:var(--font-syne)] text-lg font-semibold text-text">
                Навыки в фокусе
              </h2>
              {user.skills.length === 0 ? (
                <Link
                  href="/freelancer/profile"
                  className="block rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted hover:border-accent/40 hover:text-accent"
                >
                  Добавьте навыки — так вас находят заказчики
                </Link>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-border bg-panel-soft px-3 py-1.5 text-xs font-medium text-text"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted">Кейсов в портфолио</span>
                  <span className="font-semibold text-text">{portfolio.length}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted">Отзывов</span>
                  <span className="font-semibold text-text">{user.reviewCount}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted">Digi Prime</span>
                  <span className={primeActive ? "font-semibold text-accent" : "text-muted"}>
                    {primeActive ? "Активен" : "Выкл"}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-panel p-5">
              <h2 className="mb-4 font-[family-name:var(--font-syne)] text-lg font-semibold text-text">
                Заполненность профиля
              </h2>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <CompletionRing percent={completion.percent} />
                <ul className="min-w-0 flex-1 space-y-2.5">
                  {completion.items.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className="flex items-center gap-2.5 text-sm transition-colors hover:text-accent"
                      >
                        <span
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] ${
                            item.done
                              ? "bg-[color-mix(in_srgb,var(--accent)_22%,transparent)] text-accent"
                              : "border border-border text-muted"
                          }`}
                          aria-hidden
                        >
                          {item.done ? "✓" : ""}
                        </span>
                        <span className={item.done ? "text-text" : "text-muted"}>{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </div>
      </Panel>
    </div>
  );
}

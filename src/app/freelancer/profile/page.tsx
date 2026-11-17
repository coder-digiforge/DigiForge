import Link from "next/link";
import { Briefcase, Mail, UserRound, Wallet } from "lucide-react";
import { updateProfileAction } from "@/app/actions/marketplace";
import { AvatarField } from "@/components/AvatarField";
import { Button, ButtonLink, Input, PageTitle, Panel, Textarea } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getProfileCompletion } from "@/lib/profileCompletion";
import { listPortfolio } from "@/lib/store";

export default async function FreelancerProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireUser(["freelancer"]);
  const { saved, error } = await searchParams;
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

  return (
    <div className="space-y-6">
      <PageTitle
        title="Личные данные"
        subtitle="Профиль для каталога и выплат в USDT"
        className="mb-0"
        action={
          <ButtonLink
            href="/freelancer/public"
            variant="ghost"
            className="!rounded-full !px-4 !py-2 !text-sm"
          >
            Публичный профиль
          </ButtonLink>
        }
      />

      {saved && (
        <p className="rounded-xl border border-success/35 bg-[color-mix(in_srgb,var(--success)_12%,transparent)] px-4 py-3 text-sm text-success">
          Данные сохранены
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-danger/40 bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(240px,0.85fr)_minmax(0,1.4fr)]">
        <Panel className="h-fit p-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border border-border bg-[color-mix(in_srgb,var(--accent)_16%,transparent)]">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-2xl font-bold text-accent">
                  {user.name.slice(0, 1)}
                </div>
              )}
            </div>
            <div className="mt-4 font-[family-name:var(--font-syne)] text-xl font-semibold text-text">
              {user.name}
            </div>
            <div className="mt-1 text-sm text-muted">{user.title || "Специализация не указана"}</div>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted">
              <Mail size={14} className="text-accent" />
              {user.email}
            </div>
            <div className="mt-5 w-full rounded-xl border border-border bg-panel-soft/50 px-4 py-3 text-left">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Заполнение профиля</span>
                <span className="font-semibold text-accent">{completion.percent}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${completion.percent}%` }}
                />
              </div>
              {completion.percent < 100 && (
                <p className="mt-2 text-xs text-muted">
                  Дозаполните поля справа — выше шанс получить заказ
                </p>
              )}
            </div>
            <div className="mt-4 grid w-full grid-cols-2 gap-2 text-center text-sm">
              <div className="rounded-xl border border-border px-3 py-3">
                <div className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                  {user.rating.toFixed(1)}
                </div>
                <div className="text-xs text-muted">Рейтинг</div>
              </div>
              <div className="rounded-xl border border-border px-3 py-3">
                <div className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                  {user.reviewCount}
                </div>
                <div className="text-xs text-muted">Отзывов</div>
              </div>
            </div>
          </div>
        </Panel>

        <form action={updateProfileAction} encType="multipart/form-data" className="space-y-5">
          <Panel className="overflow-hidden p-0">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4 md:px-6">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-accent">
                <UserRound size={16} />
              </div>
              <div>
                <h2 className="font-semibold text-text">Профиль</h2>
                <p className="text-xs text-muted">Как вас видят заказчики</p>
              </div>
            </div>
            <div className="space-y-4 p-5 md:p-6">
              <AvatarField currentUrl={user.avatarUrl} name={user.name} />
              <div>
                <label className="mb-1.5 block text-sm text-text">
                  Имя <span className="text-accent">*</span>
                </label>
                <Input name="name" defaultValue={user.name} required placeholder="Сергей" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-text">Специализация</label>
                <Input
                  name="title"
                  defaultValue={user.title ?? ""}
                  placeholder="Full-stack developer"
                />
                <p className="mt-1.5 text-xs text-muted">Коротко: кто вы и в чём сила</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-text">О себе</label>
                <Textarea
                  name="bio"
                  defaultValue={user.bio ?? ""}
                  placeholder="Опыт, стек, с какими задачами работаете"
                  className="!min-h-28"
                />
              </div>
            </div>
          </Panel>

          <Panel className="overflow-hidden p-0">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4 md:px-6">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-accent">
                <Briefcase size={16} />
              </div>
              <div>
                <h2 className="font-semibold text-text">Навыки</h2>
                <p className="text-xs text-muted">По ним вас находят в каталоге</p>
              </div>
            </div>
            <div className="p-5 md:p-6">
              <label className="mb-1.5 block text-sm text-text">Список навыков</label>
              <Input
                name="skills"
                defaultValue={user.skills.join(", ")}
                placeholder="React, Next.js, TypeScript"
              />
              <p className="mt-1.5 text-xs text-muted">Через запятую</p>
              {user.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {user.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-border bg-panel-soft px-2.5 py-1 text-[11px] text-muted-2"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Panel>

          <Panel className="overflow-hidden p-0">
            <div className="flex items-center gap-3 border-b border-border px-5 py-4 md:px-6">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-accent">
                <Wallet size={16} />
              </div>
              <div>
                <h2 className="font-semibold text-text">Кошелёк для вывода</h2>
                <p className="text-xs text-muted">Только USDT</p>
              </div>
            </div>
            <div className="space-y-4 p-5 md:p-6">
              <div>
                <label className="mb-1.5 block text-sm text-text">Адрес кошелька</label>
                <Input
                  name="walletAddress"
                  defaultValue={user.walletAddress ?? ""}
                  placeholder="TX… или 0x…"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm text-text">Сеть</label>
                  <select
                    name="walletNetwork"
                    className="df-input"
                    defaultValue={user.walletNetwork ?? "TRC20"}
                  >
                    <option value="TRC20">TRC20</option>
                    <option value="ERC20">ERC20</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-text">Актив</label>
                  <input type="hidden" name="walletAsset" value="USDT" />
                  <div className="df-input flex items-center text-muted">USDT</div>
                </div>
              </div>
            </div>
          </Panel>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/freelancer/portfolio" className="text-sm text-muted hover:text-accent">
              Дополнить портфолио →
            </Link>
            <Button type="submit" className="!rounded-full !px-6">
              Сохранить изменения
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

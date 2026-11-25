import {
  Check,
  Crown,
  Percent,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { ButtonLink, PageTitle, Panel } from "@/components/ui";

const CLIENT_PERKS = [
  "Публикация проектов без подписки",
  "Доступ ко всему каталогу исполнителей",
  "Эскроу USDT до приёмки работы",
  "Чат, ставки и диспуты в кабинете",
];

const FEE_POINTS = [
  "Комиссия 10% списывается при выплате из сейфа",
  "До приёмки бюджет заморожен в эскроу",
  "Нет скрытых платежей и абонентской платы",
];

const PRIME_POINTS = [
  "60 дней DigiPrime бесплатно при регистрации",
  "Приоритет в каталоге исполнителей",
  "Заметные ставки и примеры работ",
  "Продление позже — 29 USDT / 30 дней",
];

export function PricingPanel({
  variant = "public",
}: {
  variant?: "public" | "cabinet";
}) {
  return (
    <div className="space-y-6">
      {variant === "cabinet" ? (
        <PageTitle
          title="Тарифы"
          subtitle="Для заказчиков всё бесплатно · комиссия только со сделки"
          className="mb-0"
        />
      ) : (
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(224,168,107,0.3)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] px-3 py-1 text-xs font-semibold text-accent">
            <ShieldCheck size={14} />
            Прозрачные условия · USDT
          </div>
          <h1 className="mt-4 font-[family-name:var(--font-syne)] text-4xl font-bold text-[#f5e6c8]">
            Тарифы
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Заказчики работают бесплатно. Комиссия DigiForge — 10% с завершённой сделки. Digi Prime
            — опция для фрилансеров.
          </p>
        </div>
      )}

      <section className="relative overflow-hidden rounded-3xl border border-border bg-[linear-gradient(135deg,#2a2118_0%,#1a1511_55%,#14100d_100%)] px-6 py-8 md:px-9 md:py-9">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(224,168,107,0.28),transparent_70%)]"
        />
        <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/35 bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-1 text-xs font-semibold text-accent">
              <Sparkles size={14} />
              Для заказчиков
            </div>
            <h2 className="mt-4 font-[family-name:var(--font-syne)] text-2xl font-bold leading-snug text-[#f5e6c8] md:text-3xl">
              0 USDT / месяц
            </h2>
            <p className="mt-3 max-w-[42ch] text-sm leading-relaxed text-muted">
              Публикуйте проекты, выбирайте ставки и ведите сделки через сейф — без подписки и
              платы за размещение.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink
                href="/client/projects/new"
                className="!rounded-full !px-5 !py-2.5 !text-sm"
              >
                Опубликовать проект
              </ButtonLink>
              {variant === "cabinet" ? (
                <ButtonLink
                  href="/client/freelancers"
                  variant="ghost"
                  className="!rounded-full !px-5 !py-2.5 !text-sm"
                >
                  Смотреть исполнителей
                </ButtonLink>
              ) : (
                <ButtonLink
                  href="/register"
                  variant="ghost"
                  className="!rounded-full !px-5 !py-2.5 !text-sm"
                >
                  Создать аккаунт
                </ButtonLink>
              )}
            </div>
          </div>
          <ul className="space-y-2.5 rounded-2xl border border-border bg-[color-mix(in_srgb,var(--panel)_55%,transparent)] p-5">
            {CLIENT_PERKS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-muted-2">
                <Check size={16} className="mt-0.5 shrink-0 text-accent" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="overflow-hidden p-0">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4 md:px-6">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-accent">
              <Percent size={16} />
            </div>
            <div>
              <h2 className="font-semibold text-text">Комиссия со сделки</h2>
              <p className="text-xs text-muted">Только при успешной приёмке</p>
            </div>
          </div>
          <div className="p-5 md:p-6">
            <div className="font-[family-name:var(--font-syne)] text-3xl font-bold text-accent">
              10%
            </div>
            <p className="mt-2 text-sm text-muted">
              Списывается из суммы эскроу при выплате исполнителю. До приёмки деньги в сейфе.
            </p>
            <ul className="mt-5 space-y-2.5">
              {FEE_POINTS.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-muted-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {variant === "cabinet" && (
              <ButtonLink
                href="/client/finance"
                variant="ghost"
                className="mt-5 !rounded-full !px-4 !py-2 !text-sm"
              >
                <span className="inline-flex items-center gap-2">
                  <Wallet size={14} />
                  К финансам
                </span>
              </ButtonLink>
            )}
          </div>
        </Panel>

        <Panel className="overflow-hidden p-0">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4 md:px-6">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-accent">
              <Crown size={16} />
            </div>
            <div>
              <h2 className="font-semibold text-text">Digi Prime</h2>
              <p className="text-xs text-muted">Опция для фрилансеров</p>
            </div>
          </div>
          <div className="p-5 md:p-6">
            <div className="font-[family-name:var(--font-syne)] text-3xl font-bold text-accent">
              0{" "}
              <span className="text-lg font-semibold text-muted">USDT · 60 дней</span>
            </div>
            <p className="mt-2 text-sm text-muted">
              На запуске каждый новый фрилансер получает DigiPrime бесплатно. Заказчикам подключать
              не нужно.
            </p>
            <ul className="mt-5 space-y-2.5">
              {PRIME_POINTS.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-muted-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-muted" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <ButtonLink
              href={variant === "cabinet" ? "/client/freelancers" : "/freelancers"}
              variant="ghost"
              className="mt-5 !rounded-full !px-4 !py-2 !text-sm"
            >
              Смотреть исполнителей с Prime
            </ButtonLink>
          </div>
        </Panel>
      </div>

      <Panel className="p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-accent">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-text">
                Как это работает
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
                Выбираете ставку → бюджет уходит в сейф → исполнитель сдаёт работу → вы принимаете →
                выплата минус 10%. Без предоплаты «на слово».
              </p>
            </div>
          </div>
          <ButtonLink
            href={variant === "cabinet" ? "/client/work" : "/about"}
            className="!shrink-0 !rounded-full !px-5 !py-2.5 !text-sm"
          >
            {variant === "cabinet" ? "Мои сделки" : "О платформе"}
          </ButtonLink>
        </div>
      </Panel>
    </div>
  );
}

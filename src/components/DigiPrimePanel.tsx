import { Check, Crown, Sparkles, Wallet } from "lucide-react";
import {
  buyPrimeAction,
  setPrimeAutoRenewAction,
  startPrimeTrialAction,
} from "@/app/actions/marketplace";
import { Button, ButtonLink, PageTitle, Panel } from "@/components/ui";

const BASIC_PERKS = [
  "Стандартный бонус к рейтингу",
  "Обычный вид ставки без примеров работ",
  "2 основные специализации",
];

const PRIME_PERKS = [
  "До +5% бонуса к рейтингу",
  "Prime-ставки выше обычных",
  "Приоритет в каталоге исполнителей",
  "Скрытие ставок",
  "Примеры работ и подпись в ставках",
  "Генерация ставки с AI",
  "2 дополнительные специализации",
];

function daysLeft(untilIso: string) {
  return Math.max(0, Math.ceil((new Date(untilIso).getTime() - Date.now()) / 86400000));
}

function formatUntil(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function PerkList({ items, tone = "muted" }: { items: string[]; tone?: "muted" | "accent" }) {
  return (
    <ul className="mt-5 space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm text-muted-2">
          <Check
            size={16}
            className={`mt-0.5 shrink-0 ${tone === "accent" ? "text-accent" : "text-muted"}`}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function DigiPrimePanel({
  active,
  trial,
  autoRenew,
  until,
  trialUsed,
  walletAddress,
  balanceUsdt,
  error,
  notice,
}: {
  active: boolean;
  trial: boolean;
  autoRenew: boolean;
  until?: string | null;
  trialUsed: boolean;
  walletAddress?: string;
  balanceUsdt: number;
  error?: string;
  notice?: string;
}) {
  const left = until ? daysLeft(until) : 0;
  const subtitle = active
    ? trial
      ? `Триал активен · ${left} дн. до списания`
      : `Активен до ${formatUntil(until!)}`
    : "Планы · базовый аккаунт";

  const walletShort = walletAddress
    ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
    : "не указан";

  return (
    <div className="space-y-5">
      <PageTitle title="Digi Prime" subtitle={subtitle} className="mb-0" />

      {(error || notice) && (
        <p
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-danger/40 bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-danger"
              : "border-success/35 bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-success"
          }`}
        >
          {error || notice}
        </p>
      )}

      {!active ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel className="flex flex-col p-6 md:p-7">
            <span className="inline-flex w-fit rounded-full border border-accent/40 px-2.5 py-1 text-[11px] font-semibold text-accent">
              Ваш текущий план
            </span>
            <h2 className="mt-4 font-[family-name:var(--font-syne)] text-2xl font-bold text-text">
              Базовый аккаунт
            </h2>
            <div className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-bold text-text">
              0 USDT
            </div>
            <p className="mt-1 text-sm text-muted">Бесплатно</p>
            <div className="mt-5">
              <Button variant="ghost" className="w-full !rounded-full" disabled>
                Ваш текущий план
              </Button>
            </div>
            <PerkList items={BASIC_PERKS} />
          </Panel>

          <Panel className="relative flex flex-col overflow-hidden border-accent/40 p-6 md:p-7">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(224,168,107,0.28),transparent_70%)]"
            />
            <span className="inline-flex w-fit rounded-full border border-accent/45 bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] px-2.5 py-1 text-[11px] font-semibold text-accent">
              {trialUsed ? "Подписка" : "Бесплатный триал"}
            </span>
            <h2 className="mt-4 flex items-center gap-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-text">
              Digi Prime
              <Crown size={20} className="text-accent" />
            </h2>
            {!trialUsed ? (
              <>
                <div className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-bold text-accent">
                  0 USDT
                  <span className="ml-2 text-base font-semibold text-muted">на 2 месяца</span>
                </div>
                <p className="mt-1 text-sm text-muted">Затем 29 USDT / 30 дней</p>
                <form action={startPrimeTrialAction} className="mt-5">
                  <Button type="submit" className="w-full !rounded-full shadow-[var(--df-glow)]">
                    Попробовать бесплатно
                  </Button>
                </form>
                <p className="mt-2 text-center text-xs text-muted">
                  Подписку можно отключить в любой момент
                </p>
              </>
            ) : (
              <>
                <div className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-bold text-accent">
                  29 USDT
                  <span className="ml-2 text-base font-semibold text-muted">/ 30 дней</span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  Баланс: {balanceUsdt.toLocaleString("ru-RU")} USDT
                </p>
                <form action={buyPrimeAction} className="mt-5">
                  <Button type="submit" className="w-full !rounded-full shadow-[var(--df-glow)]">
                    Оплатить Digi Prime
                  </Button>
                </form>
                <p className="mt-2 text-center text-xs text-muted">
                  Списание с доступного баланса кабинета
                </p>
              </>
            )}
            <PerkList items={PRIME_PERKS} tone="accent" />
          </Panel>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.8fr)]">
          <div className="space-y-4">
            <Panel className="flex flex-wrap items-center justify-between gap-3 p-5 md:px-6">
              <div>
                <div className="text-sm font-semibold text-text">
                  {trial ? "Триал Prime" : "Digi Prime"} · осталось {left}{" "}
                  {left === 1 ? "день" : left < 5 ? "дня" : "дней"}
                  {trial ? " до списания" : ""}
                </div>
                <p className="mt-1 text-xs text-muted">
                  Активен до {formatUntil(until!)}
                  {autoRenew ? " · автопродление включено" : " · автопродление выключено"}
                </p>
              </div>
              <span className="rounded-full border border-accent/45 bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] px-3 py-1.5 text-xs font-semibold text-accent">
                {trial ? "Триал" : "Prime"}
              </span>
            </Panel>

            <Panel className="p-5 md:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                  Подписка
                </h2>
                <span className="rounded-full border border-accent/40 px-2.5 py-0.5 text-[11px] font-semibold text-accent">
                  {trial ? "Триал Prime" : "Digi Prime"}
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-border bg-panel-soft/60 px-4 py-3 text-sm leading-relaxed text-muted">
                {trial
                  ? `Триал действует ${left} дн. После окончания спишется 29 USDT / 30 дней с баланса, если автопродление включено.`
                  : `Подписка активна. Следующее продление — 29 USDT / 30 дней${autoRenew ? "" : " (сейчас отключено)"}.`}
              </div>

              <form action={setPrimeAutoRenewAction} className="mt-4">
                <input type="hidden" name="enabled" value={autoRenew ? "0" : "1"} />
                <Button
                  type="submit"
                  variant="ghost"
                  className={
                    autoRenew
                      ? "!rounded-full !border-danger/45 !text-danger hover:!border-danger"
                      : "!rounded-full"
                  }
                >
                  {autoRenew ? "Отключить автопродление" : "Включить автопродление"}
                </Button>
              </form>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-panel-soft/50 px-4 py-3">
                  <div className="text-xs text-muted">Тип</div>
                  <div className="mt-1 text-sm font-semibold text-text">
                    {trial ? "Триал (бесплатно)" : "Подписка"}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-panel-soft/50 px-4 py-3">
                  <div className="text-xs text-muted">Срок</div>
                  <div className="mt-1 text-sm font-semibold text-text">
                    {trial ? "2 месяца" : "30 дней"}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-panel-soft/50 px-4 py-3">
                  <div className="text-xs text-muted">Стоимость после</div>
                  <div className="mt-1 text-sm font-semibold text-text">29 USDT / 30 дней</div>
                </div>
                <div className="rounded-xl border border-border bg-panel-soft/50 px-4 py-3">
                  <div className="text-xs text-muted">Первое списание</div>
                  <div className="mt-1 text-sm font-semibold text-text">
                    {trial ? "после триала" : formatUntil(until!)}
                  </div>
                </div>
              </div>

              {!trial && (
                <form action={buyPrimeAction} className="mt-5">
                  <Button type="submit" className="!rounded-full">
                    Продлить на 30 дней · 29 USDT
                  </Button>
                </form>
              )}
            </Panel>

            <Panel className="p-5 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full border border-border text-accent">
                    <Wallet size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-text">Способ оплаты</div>
                    <p className="mt-1 text-sm text-muted">
                      USDT · {walletShort}
                      <span className="mx-1.5 text-border">·</span>
                      баланс {balanceUsdt.toLocaleString("ru-RU")} USDT
                    </p>
                  </div>
                </div>
                <ButtonLink
                  href="/freelancer/profile"
                  variant="ghost"
                  className="!rounded-full !px-4 !py-2 !text-sm"
                >
                  Сменить кошелёк
                </ButtonLink>
              </div>
            </Panel>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <Panel className="overflow-hidden border-accent/35 p-5 md:p-6">
              <div className="mb-3 inline-flex items-center gap-2 text-accent">
                <Sparkles size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider">Prime</span>
              </div>
              <h3 className="font-[family-name:var(--font-syne)] text-xl font-bold leading-snug text-text">
                {trial
                  ? `Ваш триал Prime · ${left} дн. до первого списания`
                  : `Prime активен · ещё ${left} дн.`}
              </h3>
              <p className="mt-2 text-sm text-muted">
                {autoRenew
                  ? "Продлится автоматически за 29 USDT / 30 дней."
                  : "Автопродление выключено — подписка закончится в указанную дату."}
              </p>
            </Panel>

            <Panel className="p-5 md:p-6">
              <h3 className="font-[family-name:var(--font-syne)] text-base font-bold text-text">
                Преимущества Prime
              </h3>
              <PerkList items={PRIME_PERKS} tone="accent" />
            </Panel>
          </aside>
        </div>
      )}
    </div>
  );
}

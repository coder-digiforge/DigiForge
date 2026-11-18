import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Lock, Shield, Wallet } from "lucide-react";
import { depositAction, withdrawAction } from "@/app/actions/marketplace";
import { Button, ButtonLink, Input, PageTitle, Panel } from "@/components/ui";
import { WITHDRAW_REQUIRES_2FA_USDT } from "@/lib/finance/constants";
import type { LedgerEntry, LedgerKind, WalletBalances } from "@/lib/types";

export type FinanceTab = "balance" | "safe" | "services" | "archive" | "stats";

const ALL_TABS: { id: FinanceTab; label: string }[] = [
  { id: "balance", label: "Баланс" },
  { id: "safe", label: "Сейф" },
  { id: "services", label: "Сервисы" },
  { id: "archive", label: "Архив" },
  { id: "stats", label: "Статистика" },
];

const KIND_LABEL: Record<LedgerKind, string> = {
  deposit: "Пополнение",
  withdraw: "Вывод",
  withdraw_hold: "Холд вывода",
  withdraw_release: "Возврат холда",
  escrow_lock: "В сейф",
  escrow_release: "Из сейфа",
  escrow_refund: "Возврат",
  fee: "Комиссия",
  prime: "Digi Prime",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("ru-RU", { month: "long" });
}

function buildMonthStats(ledger: LedgerEntry[]) {
  const map = new Map<string, number>();
  for (const e of ledger) {
    if (e.amount <= 0) continue;
    // Доход: релизы эскроу, депозиты, возвраты
    if (!["escrow_release", "deposit", "escrow_refund"].includes(e.kind)) continue;
    const k = monthKey(e.createdAt);
    map.set(k, Math.round(((map.get(k) ?? 0) + e.amount) * 100) / 100);
  }
  const now = new Date();
  const keys: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys.map((k) => ({ key: k, label: monthLabel(k), value: map.get(k) ?? 0 }));
}

function formatUsdt(n: number) {
  return n.toLocaleString("ru-RU", { maximumFractionDigits: 2 });
}

export function FinancePanel({
  balances,
  ledger,
  error,
  role,
  walletAddress,
  tab = "balance",
  basePath,
  digiPrimeUntil,
}: {
  balances: WalletBalances;
  ledger: LedgerEntry[];
  error?: string;
  role: "client" | "freelancer";
  walletAddress?: string;
  tab?: FinanceTab;
  basePath: string;
  digiPrimeUntil?: string | null;
}) {
  const tabs = ALL_TABS.filter((t) => role === "freelancer" || t.id !== "services");
  const active = tabs.some((t) => t.id === tab) ? tab : "balance";
  const escrowOps = ledger.filter((e) =>
    ["escrow_lock", "escrow_release", "escrow_refund"].includes(e.kind),
  );
  const archive = ledger.filter((e) =>
    ["withdraw", "withdraw_hold", "withdraw_release", "fee", "prime", "deposit"].includes(
      e.kind,
    ),
  );
  const stats = buildMonthStats(ledger);
  const maxStat = Math.max(1, ...stats.map((s) => s.value));
  const yTicks = [maxStat, maxStat * 0.5, 0].map((n) => Math.round(n * 100) / 100);
  const totalIn = stats.reduce((s, x) => s + x.value, 0);
  const thisMonth = stats[stats.length - 1]?.value ?? 0;
  const best = stats.reduce((a, b) => (b.value > a.value ? b : a), stats[0]);
  const primeActive =
    digiPrimeUntil && new Date(digiPrimeUntil).getTime() > Date.now();

  return (
    <div className="space-y-5">
      <PageTitle
        title="Финансы"
        subtitle={role === "freelancer" ? "Счёт и сейф в USDT" : "Баланс и эскроу в USDT"}
        className="mb-0"
      />

      {error && (
        <p className="rounded-xl border border-danger/40 bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const on = active === t.id;
          return (
            <Link
              key={t.id}
              href={t.id === "balance" ? basePath : `${basePath}?tab=${t.id}`}
              className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                on
                  ? "bg-accent font-semibold text-[#1a120c]"
                  : "border border-border text-muted hover:border-accent/40 hover:text-text"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {active === "balance" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.85fr)]">
          <Panel className="p-5 md:p-6">
            <div className="mb-5 flex items-center gap-2 text-sm text-muted">
              <Wallet size={16} className="text-accent" />
              Доступный баланс
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-panel-soft/70 p-5">
                <div className="text-xs uppercase tracking-wider text-muted">Доступно</div>
                <div className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold text-text">
                  {balances.available}
                </div>
                <div className="mt-1 text-xs text-muted">USDT · можно тратить</div>
              </div>
              <div className="rounded-2xl border border-border bg-panel-soft/70 p-5">
                <div className="text-xs uppercase tracking-wider text-muted">В сейфе</div>
                <div className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold text-accent">
                  {balances.escrow}
                </div>
                <div className="mt-1 text-xs text-muted">Эскроу до приёмки</div>
              </div>
              <div className="rounded-2xl border border-border bg-panel-soft/70 p-5">
                <div className="text-xs uppercase tracking-wider text-muted">На выводе</div>
                <div className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold text-text">
                  {balances.pendingWithdraw}
                </div>
                <div className="mt-1 text-xs text-muted">Холд до approve</div>
              </div>
            </div>
            <p className="mt-5 text-xs leading-relaxed text-muted">
              Вывод идёт через холд и проверку админа. От {WITHDRAW_REQUIRES_2FA_USDT} USDT
              нужен 2FA. После смены пароля/email/кошелька — пауза 24 часа.
            </p>
          </Panel>

          <Panel className="p-5 md:p-6">
            <div className="mb-3 flex items-center gap-2">
              <Shield size={18} className="text-accent" />
              <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-text">
                Защита счёта
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-muted">
              Подключите 2FA в настройках, чтобы защитить вывод средств и вход в кабинет.
            </p>
            <ButtonLink
              href={role === "client" ? "/client/settings" : "/freelancer/settings"}
              variant="ghost"
              className="mt-5 !rounded-full !px-4 !py-2 !text-sm"
            >
              Открыть настройки
            </ButtonLink>
          </Panel>

          <Panel className="p-5 md:p-6 xl:col-span-2">
            <div className="grid gap-6 lg:grid-cols-2">
              <form action={depositAction} className="space-y-3">
                <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
                  Пополнить
                </h3>
                <p className="text-xs text-muted">
                  Создаётся invoice. В production зачисление только после подписанного
                  webhook провайдера.
                </p>
                <Input
                  name="amount"
                  type="number"
                  min={1}
                  step="0.01"
                  required
                  placeholder="Сумма"
                />
                <input type="hidden" name="asset" value="USDT" />
                <select name="network" className="df-input" defaultValue="TRC20">
                  <option value="TRC20">TRC20</option>
                  <option value="ERC20">ERC20</option>
                </select>
                <Button type="submit" className="!rounded-full">
                  Создать депозит
                </Button>
              </form>

              <form action={withdrawAction} className="space-y-3">
                <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
                  Вывести
                </h3>
                <p className="text-xs text-muted">
                  Минимум 10 USDT. Средства холдируются до подтверждения админом.
                </p>
                <Input
                  name="amount"
                  type="number"
                  min={10}
                  step="0.01"
                  required
                  placeholder="Сумма"
                />
                <Input
                  name="address"
                  required
                  defaultValue={walletAddress ?? ""}
                  placeholder="Адрес кошелька USDT"
                />
                <input type="hidden" name="asset" value="USDT" />
                <select name="network" className="df-input" defaultValue="TRC20">
                  <option value="TRC20">TRC20</option>
                  <option value="ERC20">ERC20</option>
                </select>
                <Button type="submit" className="!rounded-full">
                  Запросить вывод
                </Button>
              </form>
            </div>
          </Panel>
        </div>
      )}

      {active === "safe" && (
        <Panel className="overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-accent">
                <Lock size={18} />
              </div>
              <div>
                <div className="font-[family-name:var(--font-syne)] text-lg font-semibold text-text">
                  Сейф · эскроу
                </div>
                <div className="text-sm text-muted">Средства до приёмки работы</div>
              </div>
            </div>
            <div className="font-[family-name:var(--font-syne)] text-2xl font-bold text-accent">
              {balances.escrow} USDT
            </div>
          </div>
          <LedgerTable entries={escrowOps} empty="Пока нет операций по сейфу" />
        </Panel>
      )}

      {active === "services" && role === "freelancer" && (
        <Panel className="max-w-xl p-6">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-text">
            Digi Prime
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Приоритет в каталоге исполнителей и заметность для заказчиков.
          </p>
          <div className="mt-4 text-sm">
            Статус:{" "}
            <span className={primeActive ? "font-semibold text-accent" : "text-muted"}>
              {primeActive ? "Активен" : "Выключен"}
            </span>
          </div>
          <ButtonLink href="/freelancer/prime" className="mt-5 !rounded-full !px-4 !py-2 !text-sm">
            {primeActive ? "Продлить" : "Подключить"}
          </ButtonLink>
        </Panel>
      )}

      {active === "archive" && (
        <Panel className="overflow-hidden p-0">
          <div className="border-b border-border px-6 py-5">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-text">
              Архив операций
            </h2>
            <p className="mt-1 text-sm text-muted">Пополнения, выводы, комиссии и Prime</p>
          </div>
          <LedgerTable entries={archive} empty="Архив пока пуст" />
        </Panel>
      )}

      {active === "stats" && (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Panel className="p-5">
              <div className="text-xs uppercase tracking-wider text-muted">Этот месяц</div>
              <div className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-text">
                {formatUsdt(thisMonth)}
                <span className="ml-1 text-sm font-medium text-muted">USDT</span>
              </div>
            </Panel>
            <Panel className="p-5">
              <div className="text-xs uppercase tracking-wider text-muted">За 6 месяцев</div>
              <div className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-text">
                {formatUsdt(totalIn)}
                <span className="ml-1 text-sm font-medium text-muted">USDT</span>
              </div>
            </Panel>
            <Panel className="p-5">
              <div className="text-xs uppercase tracking-wider text-muted">Лучший месяц</div>
              <div className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-accent">
                {formatUsdt(best.value)}
                <span className="ml-1 text-sm font-medium text-muted">USDT</span>
              </div>
              <div className="mt-1 text-xs capitalize text-muted">{best.label}</div>
            </Panel>
          </div>

          <Panel className="p-6 md:p-8">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-text">
              Поступления по месяцам
            </h2>
            <p className="mt-1 text-sm text-muted">
              {role === "freelancer"
                ? "Оплаты из эскроу после приёмки работы"
                : "Пополнения и возвраты на баланс"}
            </p>

            {totalIn === 0 ? (
              <p className="mt-10 py-8 text-center text-sm text-muted">
                Пока нет поступлений за последние месяцы
              </p>
            ) : (
              <div className="mt-8 flex gap-3">
                <div className="flex h-52 w-12 shrink-0 flex-col justify-between py-1 text-right text-[11px] text-muted">
                  {yTicks.map((t) => (
                    <span key={t}>{formatUsdt(t)}</span>
                  ))}
                </div>
                <div className="relative min-w-0 flex-1">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-52">
                    {[0, 50, 100].map((p) => (
                      <div
                        key={p}
                        className="absolute inset-x-0 border-t border-border/60"
                        style={{ top: `${p}%` }}
                      />
                    ))}
                  </div>
                  <div className="relative flex h-52 items-end gap-2 sm:gap-3">
                    {stats.map((s) => {
                      const h = s.value > 0 ? Math.max(6, (s.value / maxStat) * 100) : 0;
                      return (
                        <div
                          key={s.key}
                          className="flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                        >
                          {s.value > 0 && (
                            <div className="mb-1 text-[11px] font-semibold text-accent">
                              {formatUsdt(s.value)}
                            </div>
                          )}
                          <div
                            className={`w-full max-w-[48px] rounded-t-lg ${
                              s.value > 0
                                ? "bg-accent shadow-[0_0_18px_rgba(224,168,107,0.25)]"
                                : "bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
                            }`}
                            style={{ height: s.value > 0 ? `${h}%` : "4px" }}
                            title={`${s.label}: ${formatUsdt(s.value)} USDT`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex gap-2 sm:gap-3">
                    {stats.map((s) => (
                      <div
                        key={s.key}
                        className="min-w-0 flex-1 truncate text-center text-[11px] capitalize text-muted"
                      >
                        {s.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <ul className="mt-8 divide-y divide-border border-t border-border">
              {[...stats].reverse().map((s) => (
                <li key={s.key} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="capitalize text-muted">{s.label}</span>
                  <span className={`font-semibold ${s.value > 0 ? "text-text" : "text-muted"}`}>
                    {s.value > 0 ? `+${formatUsdt(s.value)} USDT` : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}
    </div>
  );
}

function LedgerTable({
  entries,
  empty,
}: {
  entries: LedgerEntry[];
  empty: string;
}) {
  if (entries.length === 0) {
    return <p className="px-6 py-12 text-center text-sm text-muted">{empty}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted">
            <th className="px-6 py-3 font-medium">Дата</th>
            <th className="px-3 py-3 font-medium">Тип</th>
            <th className="px-3 py-3 font-medium">Примечание</th>
            <th className="px-6 py-3 font-medium">Сумма</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const income = e.amount > 0;
            return (
              <tr
                key={e.id}
                className="border-b border-border/70 hover:bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]"
              >
                <td className="px-6 py-3.5 text-muted">{formatDate(e.createdAt)}</td>
                <td className="px-3 py-3.5">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={`grid h-7 w-7 place-items-center rounded-full ${
                        income
                          ? "bg-[color-mix(in_srgb,var(--success)_18%,transparent)] text-success"
                          : "bg-panel-soft text-muted"
                      }`}
                    >
                      {income ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                    </span>
                    {KIND_LABEL[e.kind] ?? e.kind}
                  </span>
                </td>
                <td className="px-3 py-3.5 text-muted-2">{e.note}</td>
                <td
                  className={`px-6 py-3.5 font-semibold ${
                    income ? "text-success" : "text-text"
                  }`}
                >
                  {income ? "+" : ""}
                  {e.amount} {e.asset}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Briefcase,
  Check,
  Eye,
  Scale,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { updateProfileAction } from "@/app/actions/marketplace";
import { UserAvatar } from "@/components/UserAvatar";
import { Button, ButtonLink, Input, Panel, Textarea } from "@/components/ui";
import type {
  FreelancerLegalForm,
  FreelancerWorkStatus,
  ProfileContentLang,
  ProfileLocalizedBlock,
  User,
} from "@/lib/types";

const TABS = [
  { id: "about", label: "Обо мне", icon: UserRound },
  { id: "skills", label: "Специализация", icon: Briefcase },
  { id: "legal", label: "Юр. статус", icon: Scale },
] as const;

type TabId = (typeof TABS)[number]["id"];

const LANGS: { id: ProfileContentLang; label: string }[] = [
  { id: "ru", label: "Русский" },
  { id: "en", label: "English" },
  { id: "uk", label: "Українська" },
  { id: "pl", label: "Polski" },
  { id: "de", label: "Deutsch" },
];

const WORK_STATUSES: {
  id: FreelancerWorkStatus;
  label: string;
  hint: string;
}[] = [
  { id: "open", label: "Открыт к заказам", hint: "Готов брать новые задачи" },
  { id: "light_busy", label: "Немного занят", hint: "Беру выборочно" },
  { id: "busy", label: "Сильно занят", hint: "Свободных слотов мало" },
  { id: "paused", label: "Временно не работаю", hint: "Пауза без отключения профиля" },
  { id: "vacation", label: "В отпуске", hint: "Вернусь к дате в описании" },
];

const LEGAL_FORMS: { id: FreelancerLegalForm; label: string; hint: string }[] = [
  { id: "none", label: "Пока не указан", hint: "Можно заполнить позже" },
  { id: "individual", label: "Физлицо", hint: "Работаю как частный исполнитель" },
  { id: "sole", label: "ИП / самозанятый", hint: "Есть регистрация деятельности" },
  { id: "company", label: "Компания", hint: "Юрлицо или агентство" },
];

function emptyBlock(): ProfileLocalizedBlock {
  return { bio: "", motto: "", bidSignature: "" };
}

type PublicishUser = Omit<User, "password">;

function seedI18n(user: PublicishUser): Record<ProfileContentLang, ProfileLocalizedBlock> {
  const base: Record<ProfileContentLang, ProfileLocalizedBlock> = {
    ru: emptyBlock(),
    en: emptyBlock(),
    uk: emptyBlock(),
    pl: emptyBlock(),
    de: emptyBlock(),
  };
  for (const lang of LANGS) {
    const fromStore = user.profileI18n?.[lang.id];
    base[lang.id] = {
      bio: fromStore?.bio ?? (lang.id === "ru" ? user.bio ?? "" : ""),
      motto: fromStore?.motto ?? (lang.id === "ru" ? user.motto ?? "" : ""),
      bidSignature:
        fromStore?.bidSignature ?? (lang.id === "ru" ? user.bidSignature ?? "" : ""),
    };
  }
  return base;
}

function LangPills({
  value,
  onChange,
}: {
  value: ProfileContentLang;
  onChange: (id: ProfileContentLang) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {LANGS.map((l) => {
        const on = value === l.id;
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => onChange(l.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              on
                ? "bg-panel-soft text-text ring-1 ring-border"
                : "text-muted hover:bg-panel-soft/60 hover:text-text"
            }`}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}

export function FreelancerProfilePanel({
  user,
  completionPercent,
  saved,
  error,
  publicHref,
}: {
  user: PublicishUser;
  completionPercent: number;
  saved?: boolean;
  error?: string;
  publicHref: string;
}) {
  const [tab, setTab] = useState<TabId>("about");
  const [workStatus, setWorkStatus] = useState<FreelancerWorkStatus>(
    user.workStatus ?? "open",
  );
  const [legalForm, setLegalForm] = useState<FreelancerLegalForm>(
    user.legalForm ?? "none",
  );
  const [contentLang, setContentLang] = useState<ProfileContentLang>("ru");
  const [i18n, setI18n] = useState(() => seedI18n(user));
  const [autoSig, setAutoSig] = useState(Boolean(user.autoAddBidSignature));

  const block = i18n[contentLang];
  const primary = (i18n.ru.bio ?? "").trim() ? i18n.ru : i18n[contentLang];

  const i18nPayload = useMemo(() => JSON.stringify(i18n), [i18n]);

  function patchBlock(patch: Partial<ProfileLocalizedBlock>) {
    setI18n((prev) => ({
      ...prev,
      [contentLang]: { ...prev[contentLang], ...patch },
    }));
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-[linear-gradient(135deg,#2a2118_0%,#1a1511_55%,#14100d_100%)] px-5 py-6 md:px-8 md:py-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(224,168,107,0.26),transparent_70%)]"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(224,168,107,0.3)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] px-3 py-1 text-xs font-semibold text-accent">
              <Sparkles size={14} />
              Профиль для каталога и ставок
            </div>
            <h1 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-bold leading-tight text-[#f5e6c8]">
              Профиль фрилансера
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Статус, история о себе и специализация — то, что заказчик видит до ставки.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-[#1a1511]/70 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-6 text-sm">
              <span className="text-muted">Заполнение</span>
              <span className="font-semibold text-accent">{completionPercent}%</span>
            </div>
            <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {saved && (
        <p className="rounded-xl border border-success/35 bg-[color-mix(in_srgb,var(--success)_12%,transparent)] px-4 py-3 text-sm text-success">
          Профиль сохранён
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-danger/40 bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const on = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                on
                  ? "border border-accent/45 bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-accent"
                  : "border border-border text-muted hover:border-accent/35 hover:text-text"
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      <form
        action={updateProfileAction}
        encType="multipart/form-data"
        className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,300px)]"
      >
        <input type="hidden" name="returnTo" value="/freelancer/public" />
        <input type="hidden" name="workStatus" value={workStatus} />
        <input type="hidden" name="legalForm" value={legalForm} />
        <input type="hidden" name="profileI18n" value={i18nPayload} />
        <input type="hidden" name="bio" value={primary.bio ?? ""} />
        <input type="hidden" name="motto" value={primary.motto ?? ""} />
        <input type="hidden" name="bidSignature" value={primary.bidSignature ?? ""} />
        <input type="hidden" name="walletAddress" value={user.walletAddress ?? ""} />
        <input type="hidden" name="walletNetwork" value={user.walletNetwork ?? "TRC20"} />
        <input type="hidden" name="walletAsset" value="USDT" />
        {autoSig && <input type="hidden" name="autoAddBidSignature" value="on" />}

        <div className="min-w-0 space-y-5">
          {tab === "about" && (
            <>
              <Panel className="p-5 md:p-6">
                <div className="flex flex-wrap items-center gap-4">
                  <UserAvatar name={user.name} url={user.avatarUrl} size={64} />
                  <div className="min-w-0 flex-1">
                    <label className="mb-1.5 block text-sm text-muted">
                      Имя в каталоге <span className="text-accent">*</span>
                    </label>
                    <Input
                      name="name"
                      defaultValue={user.name}
                      required
                      placeholder="Сергей"
                      className="!rounded-xl"
                    />
                    <p className="mt-2 text-xs text-muted">
                      Фото меняется в{" "}
                      <Link href="/freelancer/profile" className="text-accent hover:underline">
                        личных данных
                      </Link>
                    </p>
                  </div>
                </div>
              </Panel>

              <Panel className="p-5 md:p-6">
                <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                  Мой статус
                </h2>
                <p className="mt-1 text-sm text-muted">Как заказчики видят вашу доступность</p>
                <div className="mt-4 space-y-2">
                  {WORK_STATUSES.map((s) => {
                    const on = workStatus === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setWorkStatus(s.id)}
                        className={`flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition ${
                          on
                            ? "border-accent/45 bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
                            : "border-border bg-panel-soft/20 hover:border-accent/30"
                        }`}
                      >
                        <span
                          className={`grid h-5 w-5 place-items-center rounded-full border ${
                            on
                              ? "border-accent bg-accent text-[#1a120c]"
                              : "border-border text-transparent"
                          }`}
                        >
                          <Check size={12} strokeWidth={3} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-text">{s.label}</span>
                          <span className="block text-xs text-muted">{s.hint}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Panel>

              <Panel className="p-5 md:p-6">
                <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                  Подробнее обо мне
                </h2>
                <p className="mt-1 text-sm text-muted">Можно заполнить на нескольких языках</p>
                <div className="mt-4">
                  <LangPills value={contentLang} onChange={setContentLang} />
                </div>
                <div className="mt-4">
                  <Textarea
                    value={block.bio ?? ""}
                    onChange={(e) => patchBlock({ bio: e.target.value })}
                    placeholder="Опыт, стек, с какими задачами работаете и какой результат даёте"
                    className="!min-h-40 !rounded-xl"
                  />
                </div>
              </Panel>

              <Panel className="p-5 md:p-6">
                <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                  Девиз
                </h2>
                <p className="mt-1 text-sm text-muted">Одна сильная фраза под именем</p>
                <div className="mt-4">
                  <LangPills value={contentLang} onChange={setContentLang} />
                </div>
                <div className="mt-4">
                  <Input
                    value={block.motto ?? ""}
                    onChange={(e) => patchBlock({ motto: e.target.value })}
                    placeholder="Дизайн в Figma и чистый код в проде"
                    className="!rounded-xl"
                  />
                </div>
              </Panel>

              <Panel className="p-5 md:p-6">
                <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                  Подпись в ставках
                </h2>
                <p className="mt-1 text-sm text-muted">Короткий хвост к комментарию ставки</p>
                <div className="mt-4">
                  <LangPills value={contentLang} onChange={setContentLang} />
                </div>
                <div className="mt-4">
                  <Input
                    value={block.bidSignature ?? ""}
                    onChange={(e) => patchBlock({ bidSignature: e.target.value })}
                    placeholder="С уважением, Сергей · DigiForge"
                    className="!rounded-xl"
                  />
                </div>
                <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm text-muted-2">
                  <input
                    type="checkbox"
                    checked={autoSig}
                    onChange={(e) => setAutoSig(e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-[var(--accent)]"
                  />
                  Автоматически добавлять подпись к ставкам
                </label>
              </Panel>
            </>
          )}

          {tab === "skills" && (
            <>
              <Panel className="p-5 md:p-6">
                <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                  Специализация
                </h2>
                <p className="mt-1 text-sm text-muted">Короткий заголовок в каталоге</p>
                <div className="mt-4">
                  <Input
                    name="title"
                    defaultValue={user.title ?? ""}
                    placeholder="Full-stack developer"
                    className="!rounded-xl"
                  />
                </div>
              </Panel>

              <Panel className="p-5 md:p-6">
                <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                  Навыки
                </h2>
                <p className="mt-1 text-sm text-muted">По ним вас находят в поиске</p>
                <div className="mt-4">
                  <Input
                    name="skills"
                    defaultValue={user.skills.join(", ")}
                    placeholder="React, Next.js, TypeScript"
                    className="!rounded-xl"
                  />
                  <p className="mt-1.5 text-xs text-muted">Через запятую</p>
                </div>
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
              </Panel>

              <Panel className="p-5 md:p-6">
                <p className="text-sm text-muted">
                  Кошелёк для вывода настраивается в{" "}
                  <Link href="/freelancer/profile" className="font-semibold text-accent hover:underline">
                    личных данных
                  </Link>
                  .
                </p>
              </Panel>
            </>
          )}

          {tab === "legal" && (
            <Panel className="p-5 md:p-6">
              <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                Юридический статус
              </h2>
              <p className="mt-1 text-sm text-muted">
                Нужен для прозрачных выплат и договоров. Не публикуется в каталоге целиком.
              </p>
              <div className="mt-4 space-y-2">
                {LEGAL_FORMS.map((s) => {
                  const on = legalForm === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setLegalForm(s.id)}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition ${
                        on
                          ? "border-accent/45 bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
                          : "border-border bg-panel-soft/20 hover:border-accent/30"
                      }`}
                    >
                      <span
                        className={`grid h-5 w-5 place-items-center rounded-full border ${
                          on
                            ? "border-accent bg-accent text-[#1a120c]"
                            : "border-border text-transparent"
                        }`}
                      >
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-text">{s.label}</span>
                        <span className="block text-xs text-muted">{s.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Panel>
          )}

          {/* Keep required fields present on other tabs */}
          {tab !== "about" && (
            <input type="hidden" name="name" value={user.name} />
          )}
          {tab !== "skills" && (
            <>
              <input type="hidden" name="title" value={user.title ?? ""} />
              <input type="hidden" name="skills" value={user.skills.join(", ")} />
            </>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Button type="submit" className="!rounded-full !px-6 shadow-[var(--df-glow)]">
              Сохранить
            </Button>
            <ButtonLink href={publicHref} variant="ghost" className="!rounded-full !px-5">
              <span className="inline-flex items-center gap-2">
                <Eye size={16} />
                Как видят заказчики
              </span>
            </ButtonLink>
            <Link
              href="/freelancer/portfolio"
              className="ml-auto text-sm text-muted transition hover:text-accent"
            >
              Портфолио →
            </Link>
          </div>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          <Panel className="p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-accent">
                <ShieldCheck size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text">Безопасность</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {user.twoFaEnabled
                    ? "2FA уже включена — аккаунт защищён лучше."
                    : "Подключите 2FA, чтобы защитить выплаты и вход."}
                </p>
                <Link
                  href="/freelancer/settings?tab=security"
                  className="mt-3 inline-flex text-sm font-semibold text-accent hover:underline"
                >
                  {user.twoFaEnabled ? "Настройки безопасности" : "Подключить 2FA"}
                </Link>
              </div>
            </div>
          </Panel>

          <Panel className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Сейчас</p>
            <p className="mt-2 text-sm font-semibold text-text">
              {WORK_STATUSES.find((s) => s.id === workStatus)?.label}
            </p>
            <p className="mt-1 text-xs text-muted">
              {user.title?.trim() || "Специализация не указана"}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl border border-border px-2 py-2.5">
                <p className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                  {user.rating.toFixed(1)}
                </p>
                <p className="text-[11px] text-muted">Оценка</p>
              </div>
              <div className="rounded-xl border border-border px-2 py-2.5">
                <p className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                  {user.reviewCount}
                </p>
                <p className="text-[11px] text-muted">Отзывов</p>
              </div>
            </div>
          </Panel>
        </aside>
      </form>
    </div>
  );
}

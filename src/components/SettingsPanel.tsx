"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Info,
  Languages,
  Lock,
  Mail,
  MessageCircle,
  Shield,
  Trash2,
} from "lucide-react";
import {
  beginTwoFaAction,
  changeEmailAction,
  changePasswordAction,
  clearSessionsAction,
  confirmTwoFaAction,
  deactivateAccountAction,
  disableTwoFaAction,
  requestEmailVerifyAction,
  saveServiceSettingsAction,
} from "@/app/actions/settings";
import { writeCabinetTheme, type CabinetTheme } from "./ThemeShell";
import { Button, PageTitle, Panel } from "./ui";
import type {
  DisplayTheme,
  LoginSession,
  UiLanguage,
  UserSettings,
  VisibilityLevel,
} from "@/lib/types";

type Tab = "service" | "security";

const EMAIL_OPTS = [
  { key: "emailDigest", label: "Ежедневный дайджест новых проектов" },
  { key: "emailMessages", label: "Новые сообщения в переписках" },
  { key: "emailService", label: "Служебные уведомления DigiForge" },
  { key: "emailOffers", label: "Специальные предложения" },
  { key: "emailNews", label: "Дайджест новостей платформы" },
  { key: "emailBlog", label: "Посты блога и гайды" },
] as const;

const LANGS: { id: UiLanguage; label: string }[] = [
  { id: "en", label: "English" },
  { id: "uk", label: "Українська" },
  { id: "ru", label: "Русский" },
  { id: "pl", label: "Polski" },
  { id: "de", label: "Deutsch" },
];

const VISIBILITY: { id: VisibilityLevel; label: string }[] = [
  { id: "nobody", label: "никто" },
  { id: "contacts", label: "только контакты" },
  { id: "everyone", label: "все" },
];

function formatLoginTime(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CheckRow({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl px-1 py-2 text-sm text-text transition hover:bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
      />
      <span>{label}</span>
    </label>
  );
}

export function SettingsPanel({
  role,
  email,
  twoFaEnabled,
  emailVerified,
  settings,
  loginLog,
  initialTab = "service",
  notice,
  error,
  totpSecret,
  totpUri,
  verifyPreview,
}: {
  role: "client" | "freelancer";
  email: string;
  twoFaEnabled: boolean;
  emailVerified: boolean;
  settings: UserSettings;
  loginLog: LoginSession[];
  initialTab?: Tab;
  notice?: string;
  error?: string;
  totpSecret?: string;
  totpUri?: string;
  verifyPreview?: string;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [theme, setTheme] = useState<DisplayTheme>(settings.theme);
  const base = role === "client" ? "/client/settings" : "/freelancer/settings";

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setTheme(settings.theme);
    writeCabinetTheme(settings.theme === "dark" ? "dark" : "light");
  }, [settings.theme]);

  const subtitle = useMemo(
    () =>
      tab === "service"
        ? "Уведомления, язык, тема и видимость профиля"
        : "Пароль, сессии и журнал входов",
    [tab],
  );

  const onThemeChange = (next: DisplayTheme) => {
    setTheme(next);
    const cabinet: CabinetTheme = next === "dark" ? "dark" : "light";
    writeCabinetTheme(cabinet);
  };

  return (
    <div className="space-y-5">
      <PageTitle title="Настройки" subtitle={subtitle} className="mb-0" />

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: "service", label: "Настройки сервиса" },
            { id: "security", label: "Безопасность" },
          ] as const
        ).map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full px-3.5 py-2 text-[13px] transition ${
                on
                  ? "border border-accent/45 bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] font-semibold text-accent"
                  : "text-muted hover:text-text"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {(notice || error) && (
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

      {tab === "service" ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.75fr)]">
          <form action={saveServiceSettingsAction} className="space-y-4">
            <input type="hidden" name="theme" value={theme} />

            <Panel className="p-5 md:p-6">
              <div className="mb-3 flex items-center gap-2">
                <Mail size={16} className="text-accent" />
                <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                  E-mail уведомления
                </h2>
              </div>
              <div className="divide-y divide-border/70">
                {EMAIL_OPTS.map((o) => (
                  <CheckRow
                    key={o.key}
                    name={o.key}
                    label={o.label}
                    defaultChecked={settings[o.key]}
                  />
                ))}
              </div>
            </Panel>

            <Panel className="p-5 md:p-6">
              <div className="mb-3 flex items-center gap-2">
                <MessageCircle size={16} className="text-accent" />
                <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                  Telegram уведомления
                </h2>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted">
                  {settings.telegramConnected
                    ? "Бот подключён — важные события приходят в Telegram"
                    : "Подключите бота, чтобы получать уведомления в Telegram"}
                </p>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-accent/45 px-3.5 py-2 text-sm font-semibold text-accent">
                  <input
                    type="checkbox"
                    name="telegramConnected"
                    defaultChecked={settings.telegramConnected}
                    className="accent-[var(--accent)]"
                  />
                  {settings.telegramConnected ? "Подключено" : "Подключить"}
                </label>
              </div>
            </Panel>

            <Panel className="p-5 md:p-6">
              <div className="mb-3 flex items-center gap-2">
                <Bell size={16} className="text-accent" />
                <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                  Push и звуковые уведомления
                </h2>
              </div>
              <CheckRow
                name="pushBrowser"
                label="Разрешить браузерные push-уведомления"
                defaultChecked={settings.pushBrowser}
              />
              <CheckRow
                name="pushSound"
                label="Звук при новом сообщении"
                defaultChecked={settings.pushSound}
              />
              <div className="mt-3">
                <label className="mb-1.5 block text-sm text-muted">Звук нового сообщения</label>
                <select
                  name="soundName"
                  defaultValue={settings.soundName}
                  className="df-input !py-2.5"
                >
                  <option value="long-trill">Длинная трель</option>
                  <option value="soft-chime">Мягкий колокольчик</option>
                  <option value="short-blip">Короткий сигнал</option>
                  <option value="none">Без звука</option>
                </select>
              </div>
            </Panel>

            <Panel className="p-5 md:p-6">
              <div className="mb-3 flex items-center gap-2">
                <Languages size={16} className="text-accent" />
                <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                  Язык интерфейса
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {LANGS.map((l) => (
                  <label
                    key={l.id}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm transition hover:border-accent/40"
                  >
                    <input
                      type="radio"
                      name="language"
                      value={l.id}
                      defaultChecked={settings.language === l.id}
                      className="accent-[var(--accent)]"
                    />
                    {l.label}
                  </label>
                ))}
              </div>
            </Panel>

            <Panel className="p-5 md:p-6">
              <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                Автоперевод
              </h2>
              <div className="mt-2">
                <CheckRow
                  name="autoTranslate"
                  label="Автоматически переводить сообщения и описания"
                  defaultChecked={settings.autoTranslate}
                />
              </div>
              <div className="mt-3">
                <label className="mb-1.5 block text-sm text-muted">
                  Не переводить эти языки
                </label>
                <div className="flex flex-wrap gap-2">
                  {LANGS.filter((l) => l.id !== "ru").map((l) => (
                    <label
                      key={l.id}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-panel-soft px-2.5 py-1 text-xs text-muted-2"
                    >
                      <input
                        type="checkbox"
                        name="excludeLanguages"
                        value={l.id}
                        defaultChecked={settings.excludeLanguages.includes(l.id)}
                        className="accent-[var(--accent)]"
                      />
                      {l.label}+
                    </label>
                  ))}
                </div>
              </div>
            </Panel>

            <Panel className="p-5 md:p-6">
              <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                Тема отображения
              </h2>
              <div className="mt-3 flex flex-wrap gap-3">
                {(
                  [
                    { id: "standard", label: "Стандартная" },
                    { id: "dark", label: "Темная" },
                  ] as const
                ).map((t) => (
                  <label
                    key={t.id}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm transition hover:border-accent/40"
                  >
                    <input
                      type="radio"
                      name="themeUi"
                      value={t.id}
                      checked={theme === t.id}
                      onChange={() => onThemeChange(t.id)}
                      className="accent-[var(--accent)]"
                    />
                    {t.label}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">
                «Стандартная» — светлая тема кабинета, «Темная» — фирменная тёмная.
              </p>
            </Panel>

            <Panel className="p-5 md:p-6">
              <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                Видимость
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    { name: "visibilityLastName", label: "Фамилия", value: settings.visibilityLastName },
                    { name: "visibilityPhone", label: "Номер телефона", value: settings.visibilityPhone },
                    {
                      name: "visibilityBirthdate",
                      label: "Дата рождения",
                      value: settings.visibilityBirthdate,
                    },
                  ] as const
                ).map((f) => (
                  <div key={f.name}>
                    <label className="mb-1.5 block text-sm text-muted">{f.label}</label>
                    <select name={f.name} defaultValue={f.value} className="df-input !py-2.5">
                      {VISIBILITY.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                <div>
                  <label className="mb-1.5 block text-sm text-muted">Поисковые системы</label>
                  <select
                    name="searchIndexing"
                    defaultValue={settings.searchIndexing ? "1" : "0"}
                    className="df-input !py-2.5"
                  >
                    <option value="1">разрешить индексировать</option>
                    <option value="0">запретить индексирование</option>
                  </select>
                </div>
              </div>
            </Panel>

            <Button type="submit" className="!rounded-full !px-6">
              Сохранить
            </Button>
          </form>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <Panel className="border-accent/30 p-5">
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-full border border-accent/40 bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-accent">
                <Lock size={18} />
              </div>
              <h3 className="font-[family-name:var(--font-syne)] text-base font-bold text-text">
                {twoFaEnabled ? "2FA включена" : "Подключите 2FA"}
              </h3>
              <p className="mt-2 text-sm text-muted">
                {twoFaEnabled
                  ? "Двухфакторная защита уже активна для входа и вывода."
                  : "Защитите вывод средств и вход в кабинет вторым фактором."}
              </p>
              <button
                type="button"
                onClick={() => setTab("security")}
                className="mt-4 text-sm font-semibold text-accent hover:underline"
              >
                Перейти в Безопасность
              </button>
            </Panel>

            <Panel className="p-5">
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-full border border-border text-accent">
                <Info size={18} />
              </div>
              <h3 className="font-[family-name:var(--font-syne)] text-base font-bold text-text">
                Не получаете письма?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Проверьте «Спам» и добавьте <span className="text-text">noreply@digiforge.io</span> в
                доверенные отправители.
              </p>
            </Panel>
          </aside>
        </div>
      ) : (
        <div className="space-y-4">
          <Panel className="p-5 md:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Shield size={16} className="text-accent" />
              <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                Безопасность
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/70 pb-4">
                <div>
                  <div className="text-sm font-semibold text-text">Пароль для входа в систему</div>
                  <p className="mt-1 text-xs text-muted">Минимум 6 символов</p>
                </div>
                <form action={changePasswordAction} className="grid w-full max-w-sm gap-2">
                  <input
                    type="password"
                    name="currentPassword"
                    placeholder="Текущий пароль"
                    className="df-input !py-2.5"
                    required
                  />
                  <input
                    type="password"
                    name="nextPassword"
                    placeholder="Новый пароль"
                    className="df-input !py-2.5"
                    required
                  />
                  <Button type="submit" variant="ghost" className="!rounded-full !text-sm">
                    Сменить пароль
                  </Button>
                </form>
              </div>

              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/70 pb-4">
                <div>
                  <div className="text-sm font-semibold text-text">Логин для входа в систему</div>
                  <p className="mt-1 text-xs text-muted">Сейчас: {email}</p>
                </div>
                <form action={changeEmailAction} className="grid w-full max-w-sm gap-2">
                  <input
                    type="email"
                    name="email"
                    defaultValue={email}
                    className="df-input !py-2.5"
                    required
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Подтвердите паролем"
                    className="df-input !py-2.5"
                    required
                  />
                  <Button type="submit" variant="ghost" className="!rounded-full !text-sm">
                    Сменить логин
                  </Button>
                </form>
              </div>

              <div className="space-y-3 border-b border-border/70 pb-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-text">Подтверждение email</div>
                    <p className="mt-1 text-xs text-muted">
                      {emailVerified
                        ? "Email подтверждён — вывод доступен"
                        : "Нужно перед первым выводом"}
                    </p>
                  </div>
                  {!emailVerified ? (
                    <form action={requestEmailVerifyAction}>
                      <Button type="submit" variant="ghost" className="!rounded-full !text-sm">
                        Отправить ссылку
                      </Button>
                    </form>
                  ) : null}
                </div>
                {verifyPreview ? (
                  <p className="break-all text-xs text-accent">
                    Dev preview:{" "}
                    <a href={verifyPreview} className="underline">
                      {verifyPreview}
                    </a>
                  </p>
                ) : null}
              </div>

              <div className="space-y-3 border-b border-border/70 pb-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-text">
                      Двухфакторная аутентификация (TOTP)
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {twoFaEnabled
                        ? "Authenticator уже подключён"
                        : "Google Authenticator / 1Password и т.п."}
                    </p>
                  </div>
                  {!twoFaEnabled && !totpSecret ? (
                    <form action={beginTwoFaAction}>
                      <Button type="submit" variant="ghost" className="!rounded-full !text-sm">
                        Настроить
                      </Button>
                    </form>
                  ) : null}
                </div>
                {totpSecret ? (
                  <div className="rounded-xl border border-border bg-panel-soft/50 p-4 text-sm">
                    <p className="text-muted">Секрет (добавьте в приложение):</p>
                    <code className="mt-1 block break-all text-text">{totpSecret}</code>
                    {totpUri ? (
                      <a
                        href={totpUri}
                        className="mt-2 inline-block text-xs text-accent underline"
                      >
                        Открыть otpauth://
                      </a>
                    ) : null}
                    <form action={confirmTwoFaAction} className="mt-3 flex flex-wrap gap-2">
                      <input
                        name="code"
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        placeholder="Код из приложения"
                        className="df-input !max-w-[160px] !py-2"
                        required
                      />
                      <Button type="submit" className="!rounded-full !text-sm">
                        Подтвердить
                      </Button>
                    </form>
                  </div>
                ) : null}
                {twoFaEnabled ? (
                  <form action={disableTwoFaAction} className="flex flex-wrap gap-2">
                    <input
                      name="code"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      placeholder="Код для отключения"
                      className="df-input !max-w-[180px] !py-2"
                      required
                    />
                    <Button type="submit" variant="ghost" className="!rounded-full !text-sm">
                      Отключить 2FA
                    </Button>
                  </form>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-text">Активные сессии</div>
                  <p className="mt-1 text-xs text-muted">Завершить вход на других устройствах</p>
                </div>
                <form
                  action={clearSessionsAction}
                  onSubmit={(e) => {
                    if (!confirm("Выйти из всех устройств, кроме текущего?")) e.preventDefault();
                  }}
                >
                  <Button
                    type="submit"
                    variant="ghost"
                    className="!rounded-full !border-danger/50 !text-sm !text-danger hover:!border-danger hover:!text-danger"
                  >
                    Выйти из всех устройств
                  </Button>
                </form>
              </div>
            </div>
          </Panel>

          <Panel className="overflow-hidden p-0">
            <div className="border-b border-border px-5 py-4 md:px-6">
              <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                Журнал входов на сервис
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-panel-soft/60 text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium md:px-6">Время входа</th>
                    <th className="px-5 py-3 font-medium md:px-6">Браузер</th>
                    <th className="px-5 py-3 font-medium md:px-6">IP</th>
                    <th className="px-5 py-3 font-medium md:px-6">Местоположение</th>
                  </tr>
                </thead>
                <tbody>
                  {loginLog.map((row) => (
                    <tr key={row.id} className="border-t border-border/70">
                      <td className="px-5 py-3 text-text md:px-6">
                        {formatLoginTime(row.createdAt)}
                        {row.current && (
                          <span className="ml-2 rounded-full bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] px-2 py-0.5 text-[10px] font-semibold text-accent">
                            сейчас
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-muted md:px-6">{row.browser}</td>
                      <td className="px-5 py-3 text-muted md:px-6">{row.ip}</td>
                      <td className="px-5 py-3 text-muted md:px-6">{row.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel className="p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-text">
                  <Trash2 size={16} className="text-danger" />
                  Деактивация аккаунта
                </div>
                <p className="mt-1 text-xs text-muted">
                  Даже после удаления аккаунт можно восстановить
                </p>
              </div>
              <form
                action={deactivateAccountAction}
                onSubmit={(e) => {
                  if (!confirm("Деактивировать аккаунт?")) e.preventDefault();
                }}
              >
                <Button
                  type="submit"
                  variant="ghost"
                  className="!rounded-full !border-danger/50 !text-sm !text-danger hover:!border-danger"
                >
                  Удалить аккаунт
                </Button>
              </form>
            </div>
            <p className="mt-4 text-xs text-muted">
              Нужна помощь?{" "}
              <Link
                href={role === "client" ? "/client/support" : "/freelancer/support"}
                className="text-accent hover:underline"
              >
                Команда заботы
              </Link>
              {" · "}
              <Link href={base} className="text-accent hover:underline">
                Вернуться к настройкам сервиса
              </Link>
            </p>
          </Panel>
        </div>
      )}
    </div>
  );
}

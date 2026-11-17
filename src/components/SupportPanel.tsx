"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";
import {
  ChevronDown,
  Clock3,
  Headphones,
  LifeBuoy,
  Mail,
  MessageCircle,
  Send,
  ShieldCheck,
} from "lucide-react";
import { submitSupportRequestAction } from "@/app/actions/support";
import { Button, PageTitle, Panel } from "./ui";

const TOPICS = [
  { id: "escrow", label: "Сделка и эскроу" },
  { id: "wallet", label: "Депозит или вывод" },
  { id: "dispute", label: "Диспут" },
  { id: "prime", label: "Digi Prime" },
  { id: "account", label: "Аккаунт и безопасность" },
  { id: "other", label: "Другое" },
] as const;

const HELP_ITEMS = [
  "Разблокировка сейфа и релизы",
  "Сети USDT · TRC20 / ERC20",
  "Модерация диспутов",
  "Digi Prime и списания",
  "Доступ к аккаунту и 2FA",
];

const HOURS = [
  { day: "Пн–Пт", time: "10:00–19:00 CET" },
  { day: "Суббота", time: "11:00–16:00 CET" },
  { day: "Воскресенье", time: "выходной" },
];

const FAQS = [
  {
    q: "Сколько ждать ответ?",
    a: "В рабочие часы CET обычно отвечаем до 2 часов. Сложные диспуты и проверки сети могут занять до суток.",
  },
  {
    q: "Что писать по эскроу?",
    a: "Укажите ID сделки или название проекта, сеть и адрес кошелька, если речь о депозите или выводе.",
  },
  {
    q: "Можно ли ускорить диспут?",
    a: "Приложите переписку, файлы сдачи и сроки. Чем конкретнее детали, тем быстрее решение модерации.",
  },
  {
    q: "Где ещё посмотреть ответы?",
    a: "Частые вопросы по комиссиям, сейфу и Prime собраны в FAQ — туда же ведёт ссылка ниже.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="border-b border-border/70 last:border-b-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 py-3.5 text-left text-sm font-semibold text-text transition hover:text-accent"
      >
        <span>{q}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-muted transition ${open ? "rotate-180 text-accent" : ""}`}
        />
      </button>
      {open && (
        <p id={panelId} className="pb-3.5 text-sm leading-relaxed text-muted-2">
          {a}
        </p>
      )}
    </div>
  );
}

export function SupportPanel({
  email,
  returnTo = "/support",
  notice,
  error,
}: {
  email?: string;
  returnTo?: string;
  notice?: string;
  error?: string;
}) {
  const faqHref = returnTo.startsWith("/client")
    ? "/client/faq"
    : returnTo.startsWith("/freelancer")
      ? "/freelancer/faq"
      : "/faq";

  return (
    <div className="space-y-5">
      <PageTitle
        title="Команда заботы"
        subtitle="Сделки, депозиты и диспуты — ответим в рабочие часы CET"
        className="mb-0"
      />

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

      <Panel className="relative overflow-hidden p-5 md:p-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(224,168,107,0.22),transparent_70%)]"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative h-[88px] w-[88px] shrink-0">
            <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_210deg,var(--accent),transparent_55%,var(--accent))] opacity-80 blur-[1px]" />
            <div className="absolute inset-[3px] overflow-hidden rounded-full border border-accent/35 bg-panel-soft">
              <Image
                src="/support/avatar-care.png"
                alt="Команда заботы DigiForge"
                width={164}
                height={164}
                className="h-full w-full object-cover"
                priority
              />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-text md:text-2xl">
                Мы рядом, когда сделка буксует
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] px-2.5 py-1 text-[11px] font-semibold text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Ответ до 2 ч
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-2">
              Напишите по эскроу, депозиту, выводу или диспуту — разберём кейс и подскажем следующий
              шаг. Для срочных вопросов удобнее форма ниже или письмо на{" "}
              <a href="mailto:support@digiforge.io" className="text-accent hover:underline">
                support@digiforge.io
              </a>
              .
            </p>
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.8fr)]">
        <div className="space-y-4">
          <Panel className="p-5 md:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Send size={16} className="text-accent" />
              <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                Написать команде
              </h2>
            </div>
            <form action={submitSupportRequestAction} className="space-y-4">
              <input type="hidden" name="returnTo" value={returnTo} />
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">Тема</label>
                <select name="topic" required defaultValue="escrow" className="df-input">
                  {TOPICS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">Email для ответа</label>
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={email ?? ""}
                  placeholder="you@example.com"
                  className="df-input"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">Сообщение</label>
                <textarea
                  name="message"
                  required
                  minLength={12}
                  rows={5}
                  placeholder="Коротко опишите ситуацию: ID сделки, сеть, что уже пробовали…"
                  className="df-input min-h-32"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" className="!rounded-full shadow-[var(--df-glow)]">
                  Отправить запрос
                </Button>
                <p className="text-xs text-muted">Ответ придёт на указанный email</p>
              </div>
            </form>
          </Panel>

          <Panel className="p-5 md:p-6">
            <div className="mb-3 flex items-center gap-2">
              <LifeBuoy size={16} className="text-accent" />
              <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                Частые вопросы
              </h2>
            </div>
            <div>
              {FAQS.map((f) => (
                <FaqItem key={f.q} q={f.q} a={f.a} />
              ))}
            </div>
            <p className="mt-4 text-xs text-muted">
              Больше ответов — в{" "}
              <Link href={faqHref} className="text-accent hover:underline">
                FAQ
              </Link>
              .
            </p>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel className="p-5 md:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Headphones size={16} className="text-accent" />
              <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                Контакты
              </h2>
            </div>
            <div className="space-y-3">
              <a
                href="mailto:support@digiforge.io"
                className="flex items-start gap-3 rounded-xl border border-border bg-panel-soft/50 px-3.5 py-3 transition hover:border-accent/40"
              >
                <Mail size={16} className="mt-0.5 shrink-0 text-accent" />
                <div>
                  <div className="text-sm font-semibold text-text">support@digiforge.io</div>
                  <div className="mt-0.5 text-xs text-muted">Основной канал для кейсов и диспутов</div>
                </div>
              </a>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-panel-soft/50 px-3.5 py-3">
                <MessageCircle size={16} className="mt-0.5 shrink-0 text-accent" />
                <div>
                  <div className="text-sm font-semibold text-text">Форма на этой странице</div>
                  <div className="mt-0.5 text-xs text-muted">
                    Запрос попадает в очередь команды заботы
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-panel-soft/50 px-3.5 py-3">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-accent" />
                <div>
                  <div className="text-sm font-semibold text-text">Безопасность</div>
                  <div className="mt-0.5 text-xs text-muted">
                    Никогда не просим seed-фразу или приватный ключ
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="p-5 md:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Clock3 size={16} className="text-accent" />
              <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                Часы работы
              </h2>
            </div>
            <ul className="space-y-2.5">
              {HOURS.map((h) => (
                <li
                  key={h.day}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-panel-soft/40 px-3.5 py-2.5 text-sm"
                >
                  <span className="text-muted-2">{h.day}</span>
                  <span className="font-semibold text-text">{h.time}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Вне часов заявки принимаем — ответ уйдёт с открытием смены.
            </p>
          </Panel>

          <Panel className="p-5 md:p-6">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
              С чем помогаем
            </h2>
            <ul className="mt-4 space-y-2">
              {HELP_ITEMS.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-muted-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

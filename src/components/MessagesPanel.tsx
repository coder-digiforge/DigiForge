"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, Download, ExternalLink, Paperclip, Shield } from "lucide-react";
import { MessageComposer } from "@/components/MessageComposer";
import { useUnreadMessages } from "@/components/UnreadMessagesProvider";
import { playNewMessageSound } from "@/lib/message-sound";
import { EmptyState } from "@/components/ui";
import type { Deal, Message, Thread } from "@/lib/types";

export type ThreadPreview = Thread & {
  peerName: string;
  lastBody?: string;
  unreadCount?: number;
  dealStatus?: Deal["status"];
  dealAmount?: number;
};

const SYSTEM_SENDER_ID = "system";

function isSystemMessage(m: Message) {
  return m.kind === "system" || m.senderId === SYSTEM_SENDER_ID;
}

function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatListTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMsg = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = Math.round((startToday.getTime() - startMsg.getTime()) / 86400000);

  if (dayDiff === 0) return formatClock(iso);
  if (dayDiff === 1) return "Вчера";
  if (dayDiff < 7) {
    return d.toLocaleDateString("ru-RU", { weekday: "short" });
  }
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function formatDayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMsg = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = Math.round((startToday.getTime() - startMsg.getTime()) / 86400000);

  if (dayDiff === 0) return "Сегодня";
  if (dayDiff === 1) return "Вчера";
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: d.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

function sameDay(a: string, b: string) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function isImageAttachment(attachment: NonNullable<Message["attachment"]>) {
  if (attachment.mime?.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(attachment.name);
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const dim =
    size === "lg" ? "h-14 w-14 text-lg" : size === "sm" ? "h-8 w-8 text-xs" : "h-11 w-11 text-[15px]";
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-full bg-[linear-gradient(145deg,#3a2f26,#1c1612)] font-semibold text-accent ring-1 ring-[rgba(224,168,107,0.28)] ${dim}`}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function UnreadPill({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="grid h-[20px] min-w-[20px] shrink-0 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-[#1a120c]">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function MessagesPanel({
  threads: initialThreads,
  active: initialActive,
  messages: initialMessages,
  basePath,
  currentUserId,
  title = "Сообщения",
}: {
  threads: ThreadPreview[];
  active?: ThreadPreview | null;
  messages: Message[];
  basePath: string;
  currentUserId: string;
  title?: string;
  subtitle?: string;
}) {
  const [threads, setThreads] = useState(initialThreads);
  const [messages, setMessages] = useState(initialMessages);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const activeId = initialActive?.id ?? null;
  const active = threads.find((t) => t.id === activeId) ?? initialActive ?? null;
  const lastMsgId = useRef(initialMessages[initialMessages.length - 1]?.id ?? "");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { refresh } = useUnreadMessages();

  const sync = useCallback(async () => {
    const qs = activeId
      ? `?threadId=${encodeURIComponent(activeId)}&markRead=1`
      : "";
    try {
      const res = await fetch(`/api/messages/live${qs}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        threads?: ThreadPreview[];
        messages?: Message[];
        threadId?: string | null;
      };
      if (data.threads) setThreads(data.threads);
      if (activeId && data.threadId === activeId && data.messages) {
        const next = data.messages;
        const newest = next[next.length - 1];
        if (newest && newest.id !== lastMsgId.current) {
          const incoming = next.filter(
            (m) =>
              m.createdAt > (messages[messages.length - 1]?.createdAt ?? "") &&
              m.senderId !== currentUserId,
          );
          const peerIncoming = incoming.filter((m) => !isSystemMessage(m));
          if (peerIncoming.length > 0) {
            playNewMessageSound();
            setFlashIds(new Set(peerIncoming.map((m) => m.id)));
            window.setTimeout(() => setFlashIds(new Set()), 2400);
          } else if (incoming.length > 0) {
            setFlashIds(new Set(incoming.map((m) => m.id)));
            window.setTimeout(() => setFlashIds(new Set()), 2400);
          }
          lastMsgId.current = newest.id;
        }
        setMessages(next);
      }
      void refresh();
    } catch {
      // ignore
    }
  }, [activeId, currentUserId, messages, refresh]);

  useEffect(() => {
    setThreads(initialThreads);
  }, [initialThreads]);

  useEffect(() => {
    setMessages(initialMessages);
    lastMsgId.current = initialMessages[initialMessages.length - 1]?.id ?? "";
  }, [initialMessages, activeId]);

  useEffect(() => {
    void sync();
    const id = window.setInterval(() => {
      void sync();
    }, 2500);
    const onChanged = () => {
      void sync();
    };
    window.addEventListener("df:messages-changed", onChanged);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("df:messages-changed", onChanged);
    };
  }, [sync]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, activeId]);

  return (
    <div
      className={
        active
          ? "fixed inset-x-0 bottom-0 top-[var(--header-h)] z-30 flex flex-col bg-[#120e0a] lg:static lg:inset-auto lg:z-auto lg:h-[calc(100dvh-7.5rem)] lg:max-h-[calc(100dvh-7.5rem)] lg:overflow-hidden lg:rounded-[22px] lg:border lg:border-border lg:bg-panel"
          : "fixed inset-x-0 bottom-[var(--mobile-nav-h)] top-[var(--header-h)] z-30 flex flex-col bg-panel lg:static lg:inset-auto lg:bottom-auto lg:z-auto lg:h-[calc(100dvh-7.5rem)] lg:max-h-[calc(100dvh-7.5rem)] lg:overflow-hidden lg:rounded-[22px] lg:border lg:border-border"
      }
    >
      <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[320px_1fr]">
        <aside
          className={`min-h-0 flex-col bg-panel ${active ? "hidden lg:flex" : "flex"}`}
        >
          <div className="shrink-0 border-b border-border/50 px-4 pb-3 pt-3 sm:px-5 sm:pt-4">
            <h1 className="font-[family-name:var(--font-syne)] text-[28px] font-bold tracking-[-0.03em] text-[#f5e6c8]">
              {title}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {threads.length === 0
                ? "Пока пусто"
                : `${threads.length} ${threads.length === 1 ? "диалог" : "диалога"}`}
            </p>
          </div>

          <div className="df-scroll-hide min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {threads.length === 0 && (
              <div className="px-4 py-12">
                <EmptyState
                  title="Нет переписок"
                  hint="Чаты появятся после отклика или эскроу"
                />
              </div>
            )}
            <ul>
              {threads.map((t, index) => {
                const selected = active?.id === t.id;
                const unread = t.unreadCount ?? 0;
                return (
                  <li key={t.id}>
                    <Link
                      href={`${basePath}/${t.id}`}
                      className={`flex items-center gap-3 px-4 py-3.5 transition active:bg-panel-soft sm:px-5 ${
                        selected
                          ? "bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]"
                          : unread > 0
                            ? "bg-[color-mix(in_srgb,var(--accent)_7%,transparent)]"
                            : ""
                      } ${index !== threads.length - 1 ? "border-b border-border/35" : ""}`}
                    >
                      <div className="relative">
                        <Avatar name={t.peerName} />
                        {unread > 0 && (
                          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-panel" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span
                            className={`truncate text-[16px] ${
                              unread > 0 ? "font-bold text-[#f5e6c8]" : "font-semibold text-text"
                            }`}
                          >
                            {t.peerName}
                          </span>
                          <span className="shrink-0 text-[12px] text-muted">
                            {formatListTime(t.updatedAt)}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-[13px] text-muted">{t.title}</div>
                        <div className="mt-0.5 flex items-center gap-2">
                          {t.lastBody && (
                            <div
                              className={`min-w-0 flex-1 truncate text-[14px] ${
                                unread > 0 ? "font-medium text-text" : "text-muted-2"
                              }`}
                            >
                              {t.lastBody}
                            </div>
                          )}
                          <UnreadPill count={unread} />
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        <section
          className={`min-h-0 flex-col bg-[#120e0a] ${active ? "flex" : "hidden lg:flex"}`}
        >
          {!active ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <Avatar name="?" size="lg" />
              <EmptyState
                title="Выберите диалог"
                hint={
                  basePath.includes("/client/")
                    ? "Слева — переписки с исполнителями"
                    : "Слева — переписки с заказчиками"
                }
              />
            </div>
          ) : (
            <>
              <header className="relative flex shrink-0 items-center border-b border-border/50 bg-[color-mix(in_srgb,var(--panel)_96%,transparent)] px-1 py-2 backdrop-blur-md sm:px-3">
                <Link
                  href={basePath}
                  className="z-10 inline-flex items-center gap-0.5 rounded-full px-1.5 py-2 text-[15px] font-medium text-[#0a84ff] active:opacity-70 lg:invisible"
                >
                  <ChevronLeft size={22} strokeWidth={2.25} />
                  <span>Назад</span>
                </Link>

                <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 flex-col items-center px-20 text-center lg:pointer-events-auto lg:static lg:inset-auto lg:translate-y-0 lg:flex-1 lg:flex-row lg:gap-3 lg:px-0 lg:text-left">
                  <Avatar name={active.peerName} size="sm" />
                  <div className="min-w-0 lg:flex-1">
                    <div className="truncate text-[14px] font-semibold leading-tight text-text sm:text-[15px]">
                      {active.peerName}
                    </div>
                    <div className="truncate text-[11px] text-muted lg:text-xs">{active.title}</div>
                  </div>
                </div>
              </header>

              {active.dealStatus === "pending_funding" && (
                <div className="shrink-0 border-b border-[rgba(224,168,107,0.28)] bg-[color-mix(in_srgb,var(--accent)_10%,#1a1410)] px-4 py-2.5">
                  <div className="mx-auto flex max-w-xl items-start gap-2.5">
                    <Shield
                      size={16}
                      className="mt-0.5 shrink-0 text-accent"
                      strokeWidth={2.25}
                    />
                    <div className="min-w-0 flex-1 text-[12.5px] leading-snug text-[#e8dcc8]">
                      {basePath.includes("/client/") ? (
                        <>
                          Эскроу ещё не оплачен
                          {active.dealAmount != null ? ` · ${active.dealAmount} USDT` : ""}.
                          Исполнитель не должен начинать работу до пополнения сейфа.{" "}
                          <Link
                            href="/client/work"
                            className="font-semibold text-accent underline-offset-2 hover:underline"
                          >
                            Оплатить эскроу
                          </Link>
                        </>
                      ) : (
                        <>
                          Эскроу ещё не оплачен
                          {active.dealAmount != null ? ` · ${active.dealAmount} USDT` : ""}. Не
                          начинайте работу, пока заказчик не пополнит сейф.
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div
                ref={scrollRef}
                className="df-scroll-hide min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-5 sm:py-4"
              >
                {messages.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
                    <Avatar name={active.peerName} size="lg" />
                    <p className="text-[15px] font-semibold text-text">{active.peerName}</p>
                    <p className="max-w-[240px] text-[13px] text-muted">Напишите первое сообщение</p>
                  </div>
                )}

                {messages.map((m, i) => {
                  const system = isSystemMessage(m);
                  const mine = !system && m.senderId === currentUserId;
                  const prev = messages[i - 1];
                  const next = messages[i + 1];
                  const showDay = !prev || !sameDay(prev.createdAt, m.createdAt);
                  const prevSystem = prev ? isSystemMessage(prev) : false;
                  const nextSystem = next ? isSystemMessage(next) : false;
                  const groupWithPrev =
                    !system &&
                    !prevSystem &&
                    prev &&
                    prev.senderId === m.senderId &&
                    sameDay(prev.createdAt, m.createdAt) &&
                    new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < 120000;
                  const groupWithNext =
                    !system &&
                    !nextSystem &&
                    next &&
                    next.senderId === m.senderId &&
                    sameDay(next.createdAt, m.createdAt) &&
                    new Date(next.createdAt).getTime() - new Date(m.createdAt).getTime() < 120000;
                  const flash = flashIds.has(m.id);

                  if (system) {
                    return (
                      <div key={m.id}>
                        {showDay && (
                          <div className="mb-3 mt-2 flex justify-center first:mt-0">
                            <span className="rounded-full bg-panel-soft/80 px-3 py-1 text-[11px] font-medium text-muted">
                              {formatDayLabel(m.createdAt)}
                            </span>
                          </div>
                        )}
                        <div className="my-3 flex justify-center px-1">
                          <div
                            className={`max-w-[min(94%,420px)] rounded-2xl border border-[rgba(224,168,107,0.3)] bg-[color-mix(in_srgb,var(--accent)_9%,rgba(28,20,16,0.92))] px-4 py-3 text-center shadow-[0_8px_28px_rgba(0,0,0,0.22)] transition ${
                              flash
                                ? "ring-2 ring-accent/70 shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_22%,transparent)]"
                                : ""
                            }`}
                          >
                            <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
                              <Shield size={11} strokeWidth={2.5} />
                              DigiForge · эскроу
                            </div>
                            <div className="mt-1.5 text-[13px] font-medium leading-snug text-[#f0e4d0]">
                              {m.body}
                            </div>
                            <div className="mt-1.5 text-[10px] text-muted">
                              {formatClock(m.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const radius = mine
                    ? [
                        "rounded-[18px]",
                        groupWithPrev ? "rounded-tr-md" : "",
                        groupWithNext ? "rounded-br-md" : "rounded-br-sm",
                      ].join(" ")
                    : [
                        "rounded-[18px]",
                        groupWithPrev ? "rounded-tl-md" : "",
                        groupWithNext ? "rounded-bl-md" : "rounded-bl-sm",
                      ].join(" ");

                  return (
                    <div key={m.id}>
                      {showDay && (
                        <div className="mb-3 mt-2 flex justify-center first:mt-0">
                          <span className="rounded-full bg-panel-soft/80 px-3 py-1 text-[11px] font-medium text-muted">
                            {formatDayLabel(m.createdAt)}
                          </span>
                        </div>
                      )}
                      <div
                        className={`flex ${mine ? "justify-end" : "justify-start"} ${
                          groupWithPrev ? "mt-0.5" : "mt-2"
                        }`}
                      >
                        <div
                          className={`max-w-[min(85%,340px)] overflow-hidden px-3.5 py-2 text-[15px] leading-[1.35] transition sm:max-w-[65%] ${radius} ${
                            mine ? "bg-[#0a84ff] text-white" : "bg-[#2c2c2e] text-[#f5f5f7]"
                          } ${
                            flash
                              ? "ring-2 ring-accent shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_28%,transparent)]"
                              : ""
                          }`}
                        >
                          {m.body ? (
                            <div className="whitespace-pre-wrap break-words">{m.body}</div>
                          ) : null}
                          {m.attachment && (
                            <div
                              className={`mt-1.5 overflow-hidden rounded-2xl ${
                                mine ? "bg-black/15" : "bg-black/25"
                              }`}
                            >
                              {isImageAttachment(m.attachment) && (
                                <a
                                  href={m.attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block overflow-hidden"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={m.attachment.url}
                                    alt={m.attachment.name}
                                    className="h-auto max-h-56 w-full object-cover"
                                  />
                                </a>
                              )}
                              <div className="flex items-start gap-2 px-3 py-2">
                                <Paperclip size={14} className="mt-0.5 shrink-0 opacity-80" />
                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-medium">
                                    {m.attachment.name}
                                  </div>
                                  <div className="mt-1.5 flex flex-wrap gap-3 text-xs font-semibold opacity-90">
                                    <a
                                      href={m.attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
                                    >
                                      <ExternalLink size={12} />
                                      Открыть
                                    </a>
                                    <a
                                      href={m.attachment.url}
                                      download={m.attachment.name}
                                      className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
                                    >
                                      <Download size={12} />
                                      Скачать
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          <div
                            className={`mt-1 text-right text-[10px] ${
                              mine ? "text-white/70" : "text-white/45"
                            }`}
                          >
                            {formatClock(m.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="shrink-0">
                <MessageComposer threadId={active.id} onSent={() => void sync()} />
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

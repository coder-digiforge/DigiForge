import Link from "next/link";
import { Download, ExternalLink, MessageSquare, Paperclip } from "lucide-react";
import { MessageComposer } from "@/components/MessageComposer";
import { EmptyState, PageTitle, Panel } from "@/components/ui";
import type { Message, Thread } from "@/lib/types";

export type ThreadPreview = Thread & {
  peerName: string;
  lastBody?: string;
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function isImageAttachment(attachment: NonNullable<Message["attachment"]>) {
  if (attachment.mime?.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(attachment.name);
}

export function MessagesPanel({
  threads,
  active,
  messages,
  basePath,
  currentUserId,
  title = "Переписки",
  subtitle = "Диалоги по проектам и сделкам",
}: {
  threads: ThreadPreview[];
  active?: ThreadPreview | null;
  messages: Message[];
  basePath: string;
  currentUserId: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex h-[calc(100dvh-8.75rem)] max-h-[calc(100dvh-8.75rem)] flex-col">
      <PageTitle title={title} subtitle={subtitle} className="mb-4 shrink-0" />
      <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
      <div className="grid min-h-0 flex-1 lg:grid-cols-[300px_1fr]">
        {/* Thread list — scroll */}
        <aside className="flex min-h-0 flex-col border-b border-border lg:border-b-0 lg:border-r">
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-3">
            {threads.length === 0 && (
              <div className="px-2 py-8">
                <EmptyState title="Пока нет переписок" hint="Чаты появятся после отклика или эскроу" />
              </div>
            )}
            {threads.map((t) => {
              const selected = active?.id === t.id;
              return (
                <Link
                  key={t.id}
                  href={`${basePath}/${t.id}`}
                  className={`block rounded-xl px-3 py-3 transition ${
                    selected
                      ? "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)]"
                      : "hover:bg-panel-soft"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                        selected
                          ? "bg-accent text-[#1a120c]"
                          : "bg-panel-soft text-accent"
                      }`}
                    >
                      {t.peerName.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="truncate text-sm font-semibold text-text">{t.peerName}</div>
                        <div className="shrink-0 text-[11px] text-muted">{formatTime(t.updatedAt)}</div>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted">{t.title}</div>
                      {t.lastBody && (
                        <div className="mt-1 truncate text-xs text-muted-2">{t.lastBody}</div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </aside>

        {/* Chat pane — messages scroll, composer fixed */}
        <section className="flex min-h-0 flex-col bg-[color-mix(in_srgb,var(--bg-deep)_55%,transparent)]">
          {!active ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full border border-border text-accent">
                <MessageSquare size={22} />
              </div>
              <EmptyState
                title="Выберите диалог"
                hint={
                  basePath.includes("/client/")
                    ? "Слева — ваши переписки с исполнителями"
                    : "Слева — ваши переписки с заказчиками"
                }
              />
            </div>
          ) : (
            <>
              <header className="flex shrink-0 items-center gap-3 border-b border-border bg-panel/80 px-5 py-4">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-panel-soft text-sm font-semibold text-accent">
                  {active.peerName.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-text">{active.peerName}</div>
                  <div className="truncate text-xs text-muted">{active.title}</div>
                </div>
              </header>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-5 md:px-6">
                {messages.length === 0 && (
                  <p className="py-10 text-center text-sm text-muted">Напишите первое сообщение</p>
                )}
                {messages.map((m) => {
                  const mine = m.senderId === currentUserId;
                  const tone = mine ? "text-[#1a120c]" : "text-text";
                  const muted = mine ? "text-[#1a120c]/70" : "text-muted";
                  return (
                    <div
                      key={m.id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[min(100%,520px)] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          mine
                            ? "rounded-br-md bg-accent text-[#1a120c]"
                            : "rounded-bl-md border border-border bg-panel text-text"
                        }`}
                      >
                        {m.body ? (
                          <div className={`whitespace-pre-wrap ${tone}`}>{m.body}</div>
                        ) : null}
                        {m.attachment && (
                          <div
                            className={`mt-1.5 overflow-hidden rounded-xl border ${
                              mine
                                ? "border-[#1a120c]/20 bg-[#1a120c]/10"
                                : "border-border bg-panel-soft"
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
                                  className="h-auto max-h-56 w-full object-contain"
                                />
                              </a>
                            )}
                            <div className="flex items-start gap-2 px-3 py-2">
                              <Paperclip size={14} className={`mt-0.5 shrink-0 ${muted}`} />
                              <div className="min-w-0 flex-1">
                                <div className={`truncate text-sm font-medium ${tone}`}>
                                  {m.attachment.name}
                                </div>
                                <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
                                  <a
                                    href={m.attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`inline-flex items-center gap-1 underline-offset-2 hover:underline ${
                                      mine ? "text-[#1a120c]" : "text-accent"
                                    }`}
                                  >
                                    <ExternalLink size={12} />
                                    Открыть
                                  </a>
                                  <a
                                    href={m.attachment.url}
                                    download={m.attachment.name}
                                    className={`inline-flex items-center gap-1 underline-offset-2 hover:underline ${
                                      mine ? "text-[#1a120c]" : "text-accent"
                                    }`}
                                  >
                                    <Download size={12} />
                                    Скачать
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className={`mt-1 text-[10px] ${muted}`}>
                          {formatTime(m.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="shrink-0">
                <MessageComposer threadId={active.id} />
              </div>
            </>
          )}
        </section>
      </div>
    </Panel>
    </div>
  );
}

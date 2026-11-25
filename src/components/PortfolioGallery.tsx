"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState, useTransition } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  MapPin,
  Pencil,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import type { PortfolioAuthor } from "@/lib/portfolio-author";

export type PortfolioCardItem = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  priceUsdt?: number;
  projectUrl?: string;
  cover: string;
  createdAt?: string;
};

function formatCaseDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

function SideCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-panel p-4 ${className}`}>{children}</div>
  );
}

export function PortfolioGallery({
  items,
  editable = false,
  author,
  onEdit,
  onDelete,
}: {
  items: PortfolioCardItem[];
  /** @deprecated равная сетка как в кабинете */
  featured?: boolean;
  editable?: boolean;
  author?: PortfolioAuthor;
  onEdit?: (item: PortfolioCardItem) => void;
  onDelete?: (item: PortfolioCardItem) => void | Promise<void>;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const titleId = useId();
  const activeIndex = activeId ? items.findIndex((i) => i.id === activeId) : -1;
  const active = activeIndex >= 0 ? items[activeIndex] : null;

  function go(delta: number) {
    if (items.length === 0 || activeIndex < 0) return;
    const next = (activeIndex + delta + items.length) % items.length;
    setActiveId(items[next].id);
  }

  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveId(null);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, activeIndex, items]);

  const addedLabel = formatCaseDate(active?.createdAt);

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((c) => {
          const category = c.tags[0] ?? "Кейс";
          const deleting = isPending && pendingId === c.id;
          return (
            <div key={c.id} className="group flex flex-col text-left">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-[#1a1511]">
                <button
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  className="absolute inset-0"
                  aria-label={`Открыть кейс ${c.title}`}
                >
                  <Image
                    src={c.cover}
                    alt=""
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                </button>
                {c.priceUsdt != null && (
                  <span className="pointer-events-none absolute right-3 top-3 z-[1] rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-[#1a120c] shadow-[0_6px_18px_rgba(0,0,0,0.35)]">
                    {c.priceUsdt.toLocaleString("ru-RU")} USDT
                  </span>
                )}
                {editable && (
                  <>
                    <div
                      className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100"
                      aria-hidden
                    />
                    <div className="absolute bottom-3 left-3 z-[2] flex gap-1.5 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                      <button
                        type="button"
                        aria-label="Редактировать"
                        disabled={deleting}
                        onClick={() => onEdit?.(c)}
                        className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-[#1a1511]/92 text-text shadow-[0_8px_20px_rgba(0,0,0,0.35)] backdrop-blur-sm transition hover:border-accent/50 hover:text-accent disabled:opacity-50"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        aria-label="Удалить"
                        disabled={deleting}
                        onClick={() => {
                          if (!onDelete) return;
                          if (!window.confirm(`Удалить кейс «${c.title}»?`)) return;
                          setPendingId(c.id);
                          startTransition(async () => {
                            await onDelete(c);
                            setPendingId(null);
                          });
                        }}
                        className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-[#1a1511]/92 text-[#e8b4a8] shadow-[0_8px_20px_rgba(0,0,0,0.35)] backdrop-blur-sm transition hover:border-danger/50 hover:bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] hover:text-danger disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => setActiveId(c.id)}
                className="mt-3.5 px-0.5 text-left transition"
              >
                <h2 className="truncate font-[family-name:var(--font-syne)] text-[17px] font-bold leading-snug text-text transition-colors group-hover:text-accent">
                  {c.title}
                </h2>
                <p className="mt-1 truncate text-[13px] text-muted">{category}</p>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-2">
                  {c.summary}
                </p>
              </button>
            </div>
          );
        })}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4 md:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
            aria-label="Закрыть"
            onClick={() => setActiveId(null)}
          />
          <div className="relative z-10 flex max-h-[min(94dvh,920px)] w-full max-w-6xl flex-col overflow-hidden rounded-t-3xl border border-border bg-bg-deep shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:rounded-3xl">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
              <p className="truncate text-sm text-muted">Кейс портфолио</p>
              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted transition hover:border-accent/40 hover:text-accent"
                aria-label="Закрыть"
              >
                <X size={16} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)] lg:gap-6 lg:p-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 max-w-3xl">
                      <h2
                        id={titleId}
                        className="font-[family-name:var(--font-syne)] text-2xl font-bold leading-tight text-text md:text-[28px]"
                      >
                        {active.title}
                      </h2>
                      <p className="mt-1.5 text-sm text-muted">{active.tags[0] ?? "Кейс"}</p>
                      {active.priceUsdt != null && (
                        <p className="mt-2 text-lg font-semibold text-muted-2">
                          {active.priceUsdt.toLocaleString("ru-RU")} USDT
                        </p>
                      )}
                    </div>

                    {items.length > 1 && (
                      <div className="flex items-center gap-1 rounded-full border border-border bg-panel px-1.5 py-1 text-sm text-muted">
                        <button
                          type="button"
                          onClick={() => go(-1)}
                          className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-panel-soft hover:text-accent"
                          aria-label="Предыдущий кейс"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <span className="min-w-[7.5rem] text-center tabular-nums">
                          Работа {activeIndex + 1} из {items.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => go(1)}
                          className="grid h-8 w-8 place-items-center rounded-full transition hover:bg-panel-soft hover:text-accent"
                          aria-label="Следующий кейс"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative mt-5 aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-[#1a1511] sm:aspect-[2/1]">
                    <Image
                      src={active.cover}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 720px"
                      priority
                    />
                  </div>

                  <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-muted-2 md:text-[15px]">
                    {active.summary}
                  </p>

                  {active.tags.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {active.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-[color-mix(in_srgb,var(--accent)_28%,transparent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] px-3 py-1.5 text-xs font-medium text-accent"
                        >
                          #{tag.replace(/^#/, "")}
                        </span>
                      ))}
                    </div>
                  )}

                  {active.projectUrl && (
                    <a
                      href={active.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#1a120c] transition hover:opacity-90"
                    >
                      <ExternalLink size={16} />
                      Открыть проект
                    </a>
                  )}
                </div>

                <aside className="space-y-3 lg:sticky lg:top-0 lg:self-start">
                  {author && (
                    <SideCard>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Фрилансер
                      </p>
                      <div className="mt-3 flex items-start gap-3">
                        <UserAvatar name={author.name} url={author.avatarUrl} size={52} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-text">{author.name}</p>
                          {author.location && (
                            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
                              <MapPin size={12} className="shrink-0" />
                              {author.location}
                            </p>
                          )}
                          <p
                            className={`mt-1 text-xs font-semibold ${
                              author.available ? "text-accent" : "text-muted"
                            }`}
                          >
                            {author.available ? "Свободен для работы" : "Сейчас недоступен"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                        <div>
                          <p className="text-[11px] text-muted">Проектов</p>
                          <p className="mt-0.5 text-sm font-bold text-text">{author.projectCount}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-muted">Оценка</p>
                          <p className="mt-0.5 inline-flex items-center justify-center gap-0.5 text-sm font-bold text-text">
                            {author.rating.toFixed(1)}
                            <Star size={12} className="fill-accent text-accent" />
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-muted">Отзывов</p>
                          <p className="mt-0.5 text-sm font-bold text-text">{author.reviewCount}</p>
                        </div>
                      </div>

                      {author.profileHref && (
                        <Link
                          href={author.profileHref}
                          className="mt-4 flex w-full items-center justify-center rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-[#1a120c] transition hover:opacity-90"
                        >
                          {author.profileCta ?? "Профиль"}
                        </Link>
                      )}
                    </SideCard>
                  )}

                  {author && author.indicators.length > 0 && (
                    <SideCard>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Показатели
                      </p>
                      <ul className="mt-3 space-y-2.5">
                        {author.indicators.map((row) => (
                          <li
                            key={row.label}
                            className="flex items-start justify-between gap-3 text-sm"
                          >
                            <span className="inline-flex items-center gap-2 text-muted">
                              {row.label.includes("Ставк") ? (
                                <Users size={14} className="shrink-0 text-accent" />
                              ) : (
                                <Clock3 size={14} className="shrink-0 text-accent" />
                              )}
                              {row.label}
                            </span>
                            <span className="shrink-0 font-medium text-text">{row.value}</span>
                          </li>
                        ))}
                      </ul>
                    </SideCard>
                  )}

                  <SideCard>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Детали
                    </p>
                    <div className="mt-3 space-y-2.5 text-sm">
                      {addedLabel && (
                        <div className="flex items-center gap-2 text-muted-2">
                          <Calendar size={14} className="shrink-0 text-accent" />
                          Добавлена: {addedLabel}
                        </div>
                      )}
                      {author?.title && (
                        <p className="text-muted">
                          Специализация: <span className="text-text">{author.title}</span>
                        </p>
                      )}
                      {!addedLabel && !author?.title && (
                        <p className="text-muted">Кейс из портфолио DigiForge</p>
                      )}
                    </div>
                  </SideCard>
                </aside>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

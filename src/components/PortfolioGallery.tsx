"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";
import { ExternalLink, X } from "lucide-react";

export type PortfolioCardItem = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  priceUsdt?: number;
  projectUrl?: string;
  cover: string;
};

export function PortfolioGallery({
  items,
  featured = false,
}: {
  items: PortfolioCardItem[];
  featured?: boolean;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const titleId = useId();
  const active = items.find((i) => i.id === activeId) ?? null;
  const activeIndex = active ? items.findIndex((i) => i.id === active.id) : -1;

  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [active]);

  return (
    <>
      <div
        className={
          featured && items.length > 1
            ? "grid gap-4 lg:grid-cols-2 xl:grid-cols-3"
            : "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        }
      >
        {items.map((c, i) => {
          const isFeatured = featured && i === 0 && items.length > 1;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveId(c.id)}
              className={`group overflow-hidden rounded-2xl border border-border bg-panel text-left transition duration-300 hover:border-accent/45 hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)] ${
                isFeatured ? "sm:col-span-2 xl:col-span-2 xl:row-span-1" : ""
              }`}
            >
              <div
                className={`relative overflow-hidden bg-[#1a1511] ${
                  isFeatured ? "aspect-[21/10] sm:aspect-[2/1]" : "aspect-[16/10]"
                }`}
              >
                <Image
                  src={c.cover}
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.04]"
                  sizes={
                    isFeatured
                      ? "(max-width: 1280px) 100vw, 66vw"
                      : "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  }
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#120e0a]/90 via-[#120e0a]/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                  <span className="rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[11px] text-[#f6f1e8] backdrop-blur-sm">
                    {isFeatured ? "Избранный кейс" : `Кейс ${i + 1}`}
                  </span>
                  {c.priceUsdt != null && (
                    <span className="rounded-full border border-accent/30 bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] px-2.5 py-1 text-[11px] font-semibold text-accent backdrop-blur-sm">
                      {c.priceUsdt.toLocaleString("ru-RU")} USDT
                    </span>
                  )}
                </div>
              </div>
              <div className={`p-5 ${isFeatured ? "sm:p-6" : ""}`}>
                <h2
                  className={`font-[family-name:var(--font-syne)] font-semibold text-text transition-colors group-hover:text-accent ${
                    isFeatured ? "text-xl md:text-2xl" : "text-lg"
                  }`}
                >
                  {c.title}
                </h2>
                <p
                  className={`mt-2 text-sm leading-relaxed text-muted ${
                    isFeatured ? "line-clamp-3 max-w-2xl" : "line-clamp-3"
                  }`}
                >
                  {c.summary}
                </p>
                {c.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {c.tags.slice(0, isFeatured ? 6 : 4).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-border bg-panel-soft px-2.5 py-1 text-[11px] text-muted-2"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-4 text-xs font-medium text-accent">Открыть кейс →</div>
              </div>
            </button>
          );
        })}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6"
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
          <div className="relative z-10 flex max-h-[min(92dvh,880px)] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-border bg-[#1a1511] shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:rounded-3xl">
            <div className="relative aspect-[16/9] shrink-0 bg-[#120e0a] sm:aspect-[2/1]">
              <Image
                src={active.cover}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1511] via-transparent to-black/20" />
              <button
                type="button"
                onClick={() => setActiveId(null)}
                className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full border border-border bg-[#120e0a]/75 text-text backdrop-blur-sm hover:border-accent/50 hover:text-accent"
                aria-label="Закрыть"
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-8 sm:py-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-muted">
                    Кейс {activeIndex + 1} из {items.length}
                  </div>
                  <h2
                    id={titleId}
                    className="mt-1 font-[family-name:var(--font-syne)] text-2xl font-bold text-text"
                  >
                    {active.title}
                  </h2>
                </div>
                {active.priceUsdt != null && (
                  <div className="rounded-full border border-accent/35 bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] px-3 py-1.5 text-sm font-semibold text-accent">
                    {active.priceUsdt.toLocaleString("ru-RU")} USDT
                  </div>
                )}
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-2">
                {active.summary}
              </p>

              {active.tags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {active.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border bg-panel-soft px-3 py-1.5 text-xs text-muted-2"
                    >
                      {tag}
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
          </div>
        </div>
      )}
    </>
  );
}

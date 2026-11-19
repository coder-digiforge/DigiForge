"use client";

import { useEffect, useState } from "react";
import {
  FolderKanban,
  ImagePlus,
  Link2,
  Plus,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { addPortfolioAction } from "@/app/actions/marketplace";
import { PortfolioCoverField } from "@/components/PortfolioCoverField";
import { PortfolioGallery, type PortfolioCardItem } from "@/components/PortfolioGallery";
import { PortfolioSummaryField } from "@/components/PortfolioSummaryField";
import { Button, ButtonLink, EmptyState, Input, Panel } from "@/components/ui";

function casesWord(n: number) {
  if (n === 1) return "работа";
  if (n >= 2 && n <= 4) return "работы";
  return "работ";
}

export function PortfolioPanel({
  items,
  error,
  publicHref = "/freelancer/public",
}: {
  items: PortfolioCardItem[];
  error?: string;
  publicHref?: string;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const withCover = items.filter((i) => i.cover && !i.cover.includes("landing/ico-")).length;
  const withLink = items.filter((i) => i.projectUrl).length;
  const totalValue = items.reduce((s, i) => s + (i.priceUsdt ?? 0), 0);

  useEffect(() => {
    if (!addOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAddOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [addOpen]);

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-[linear-gradient(135deg,#2a2118_0%,#1a1511_55%,#14100d_100%)] px-5 py-6 md:px-8 md:py-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(224,168,107,0.26),transparent_70%)]"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(224,168,107,0.3)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] px-3 py-1 text-xs font-semibold text-accent">
              <Sparkles size={14} />
              Кейсы для ставок и профиля
            </div>
            <h1 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-bold leading-tight text-[#f5e6c8]">
              Портфолио
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Покажите сильные работы — заказчик увидит их в профиле и в ставке. Обложка и цена
              сразу повышают доверие.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="!rounded-full !px-5 shadow-[var(--df-glow)]"
              onClick={() => setAddOpen(true)}
            >
              <span className="inline-flex items-center gap-2">
                <Plus size={16} />
                Добавить кейс
              </span>
            </Button>
            <ButtonLink href={publicHref} variant="ghost" className="!rounded-full !px-5 !text-sm">
              Публичный профиль
            </ButtonLink>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-panel px-4 py-4">
          <div className="flex items-center gap-2 text-xs text-muted">
            <FolderKanban size={14} className="text-accent" />
            Кейсов
          </div>
          <div className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-text">
            {items.length}
          </div>
          <p className="mt-0.5 text-xs text-muted">{casesWord(items.length)} в каталоге</p>
        </div>
        <div className="rounded-2xl border border-border bg-panel px-4 py-4">
          <div className="flex items-center gap-2 text-xs text-muted">
            <ImagePlus size={14} className="text-accent" />
            С обложкой
          </div>
          <div className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-text">
            {withCover || items.length}
          </div>
          <p className="mt-0.5 text-xs text-muted">заметнее в ленте</p>
        </div>
        <div className="rounded-2xl border border-border bg-panel px-4 py-4">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Link2 size={14} className="text-accent" />
            Со ссылкой
          </div>
          <div className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-text">
            {withLink}
          </div>
          <p className="mt-0.5 text-xs text-muted">можно открыть работу</p>
        </div>
        <div className="rounded-2xl border border-border bg-panel px-4 py-4">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Wallet size={14} className="text-accent" />
            Сумма кейсов
          </div>
          <div className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-text">
            {totalValue > 0 ? totalValue.toLocaleString("ru-RU") : "—"}
          </div>
          <p className="mt-0.5 text-xs text-muted">USDT · ориентир</p>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-danger/40 bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <Panel className="relative overflow-hidden p-8 md:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(224,168,107,0.16),transparent_70%)]"
          />
          <div className="relative mx-auto flex max-w-md flex-col items-center text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-border bg-panel-soft text-accent">
              <FolderKanban size={24} />
            </div>
            <EmptyState
              title="Пока нет кейсов"
              hint="Добавьте первую работу — так заказчики быстрее доверяют ставке"
            />
            <Button
              type="button"
              className="mt-2 !rounded-full shadow-[var(--df-glow)]"
              onClick={() => setAddOpen(true)}
            >
              <span className="inline-flex items-center gap-2">
                <Plus size={16} />
                Добавить первый кейс
              </span>
            </Button>
          </div>
        </Panel>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm text-muted">
              Ваши кейсы · нажмите карточку, чтобы открыть
            </p>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="text-sm font-medium text-accent hover:underline"
            >
              + Ещё кейс
            </button>
          </div>
          <PortfolioGallery items={items} featured />
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-[70] flex justify-end">
          <button
            type="button"
            aria-label="Закрыть"
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
            onClick={() => setAddOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Новый кейс"
            className="relative z-[71] flex h-full w-full max-w-lg flex-col border-l border-border bg-bg-deep shadow-[-24px_0_60px_rgba(0,0,0,0.45)]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-text">
                  Новый кейс
                </h2>
                <p className="mt-1 text-sm text-muted">Заполните коротко — остальное можно позже</p>
              </div>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-muted transition hover:border-accent/40 hover:text-accent"
                aria-label="Закрыть"
              >
                <X size={16} />
              </button>
            </div>

            <form
              action={addPortfolioAction}
              encType="multipart/form-data"
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5">
                <div>
                  <label className="mb-1.5 block text-sm text-text">
                    Название <span className="text-accent">*</span>
                  </label>
                  <Input name="title" required placeholder="Например: Лендинг для кофейни" />
                </div>

                <PortfolioSummaryField />
                <PortfolioCoverField />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm text-text">Цена проекта</label>
                    <div className="relative">
                      <Input
                        name="priceUsdt"
                        type="number"
                        min={1}
                        step="1"
                        placeholder="1200"
                        className="!pr-16"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
                        USDT
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm text-text">Ссылка на работу</label>
                    <Input
                      name="projectUrl"
                      type="url"
                      placeholder="https://…"
                      inputMode="url"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-text">Теги</label>
                  <Input name="tags" placeholder="Next.js, UI, TypeScript" />
                  <p className="mt-1.5 text-xs text-muted">Через запятую</p>
                </div>

                <div className="rounded-2xl border border-border bg-panel-soft/40 p-4 text-sm text-muted">
                  <div className="mb-2 inline-flex items-center gap-2 font-semibold text-accent">
                    <Sparkles size={14} />
                    Коротко
                  </div>
                  <ul className="space-y-1.5 text-xs leading-relaxed">
                    <li>Название — конкретное</li>
                    <li>Обложка делает кейс заметнее</li>
                    <li>Цена и ссылка усиливают доверие</li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-border px-5 py-4">
                <Button type="submit" className="w-full !rounded-full shadow-[var(--df-glow)]">
                  Сохранить кейс
                </Button>
                <p className="mt-2 text-center text-[11px] text-muted">
                  <span className="text-accent">*</span> — обязательные поля
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

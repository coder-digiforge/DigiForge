"use client";

import { useEffect, useState } from "react";
import { FolderKanban, Plus, Sparkles, X } from "lucide-react";
import {
  addPortfolioAction,
  deletePortfolioAction,
  updatePortfolioAction,
} from "@/app/actions/marketplace";
import { PortfolioCoverField } from "@/components/PortfolioCoverField";
import { PortfolioGallery, type PortfolioCardItem } from "@/components/PortfolioGallery";
import { PortfolioSummaryField } from "@/components/PortfolioSummaryField";
import { Button, EmptyState, Input, Panel } from "@/components/ui";
import type { PortfolioAuthor } from "@/lib/portfolio-author";
import { PROJECT_CATEGORIES } from "@/lib/project-catalog";

const LANGS = [
  { id: "ru", label: "Русский" },
  { id: "en", label: "English" },
  { id: "uk", label: "Українська" },
  { id: "pl", label: "Polski" },
  { id: "de", label: "Deutsch" },
] as const;

export function PortfolioPanel({
  items,
  author,
  error,
}: {
  items: PortfolioCardItem[];
  author?: PortfolioAuthor;
  error?: string;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<PortfolioCardItem | null>(null);
  const [lang, setLang] = useState<(typeof LANGS)[number]["id"]>("ru");

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        setEditing(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  function openCreate() {
    setEditing(null);
    setLang("ru");
    setDrawerOpen(true);
  }

  function openEdit(item: PortfolioCardItem) {
    setEditing(item);
    setLang("ru");
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditing(null);
  }

  const categoryDefault =
    editing?.tags.find((t) =>
      (PROJECT_CATEGORIES as readonly string[]).includes(t),
    ) ?? editing?.tags[0] ?? "";

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
          <Button
            type="button"
            className="!rounded-full !px-5 shadow-[var(--df-glow)]"
            onClick={openCreate}
          >
            <span className="inline-flex items-center gap-2">
              <Plus size={16} />
              Добавить кейс
            </span>
          </Button>
        </div>
      </section>

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
              onClick={openCreate}
            >
              <span className="inline-flex items-center gap-2">
                <Plus size={16} />
                Добавить первый кейс
              </span>
            </Button>
          </div>
        </Panel>
      ) : (
        <PortfolioGallery
          items={items}
          author={author}
          editable
          onEdit={openEdit}
          onDelete={async (item) => {
            const fd = new FormData();
            fd.set("caseId", item.id);
            await deletePortfolioAction(fd);
          }}
        />
      )}

      {drawerOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Закрыть"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={closeDrawer}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={editing ? "Редактировать работу" : "Загрузить работу"}
            className="relative z-[71] flex max-h-[min(94dvh,900px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-border bg-bg-deep shadow-[0_24px_80px_rgba(0,0,0,0.5)] sm:rounded-3xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-text">
                {editing ? "Редактировать работу" : "Загрузить работу"}
              </h2>
              <button
                type="button"
                onClick={closeDrawer}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border text-muted transition hover:border-accent/40 hover:text-accent"
                aria-label="Закрыть"
              >
                <X size={16} />
              </button>
            </div>

            <form
              key={editing?.id ?? "new"}
              action={editing ? updatePortfolioAction : addPortfolioAction}
              encType="multipart/form-data"
              className="flex min-h-0 flex-1 flex-col"
            >
              {editing && <input type="hidden" name="caseId" value={editing.id} />}
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5">
                <div className="flex flex-wrap gap-2">
                  {LANGS.map((l) => {
                    const on = lang === l.id;
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setLang(l.id)}
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

                <div>
                  <label className="mb-1.5 block text-sm text-muted">
                    Название работы <span className="text-accent">*</span>
                  </label>
                  <Input
                    name="title"
                    required
                    defaultValue={editing?.title}
                    placeholder="Например: Лендинг для кофейни"
                    className="!rounded-xl"
                  />
                </div>

                <PortfolioSummaryField defaultValue={editing?.summary} />
                <PortfolioCoverField initialUrl={editing?.cover} />

                <div>
                  <label className="mb-1.5 block text-sm text-muted">Категория</label>
                  <select
                    name="category"
                    defaultValue={categoryDefault}
                    className="df-input w-full !rounded-xl appearance-none"
                  >
                    <option value="">Пожалуйста, выберите</option>
                    {PROJECT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-muted">Ссылка</label>
                  <Input
                    name="projectUrl"
                    type="url"
                    defaultValue={editing?.projectUrl}
                    placeholder="https://myawesomewebsite.com"
                    inputMode="url"
                    className="!rounded-xl"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-muted">Стоимость</label>
                  <div className="flex gap-2">
                    <Input
                      name="priceUsdt"
                      type="number"
                      min={1}
                      step="1"
                      defaultValue={editing?.priceUsdt}
                      placeholder="1200"
                      className="!rounded-xl min-w-0 flex-1"
                    />
                    <div className="grid min-w-[5.5rem] place-items-center rounded-xl border border-border bg-panel-soft px-3 text-sm font-semibold text-muted-2">
                      USDT
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border px-5 py-4">
                <Button type="submit" className="w-full !rounded-full !py-3 shadow-[var(--df-glow)]">
                  {editing ? "Сохранить изменения" : "Добавить работу"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

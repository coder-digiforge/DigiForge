import Link from "next/link";
import { FolderKanban, Plus, Sparkles } from "lucide-react";
import { addPortfolioAction } from "@/app/actions/marketplace";
import { PortfolioCoverField } from "@/components/PortfolioCoverField";
import { PortfolioGallery } from "@/components/PortfolioGallery";
import { PortfolioSummaryField } from "@/components/PortfolioSummaryField";
import { Button, EmptyState, Input, PageTitle, Panel } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { listPortfolio } from "@/lib/store";

const COVER_FALLBACKS = [
  "/landing/hero-viz.png",
  "/landing/ico-web.png",
  "/landing/ico-design.png",
  "/landing/step-choose.png",
];

function coverFor(id: string, coverUrl?: string) {
  if (coverUrl) return coverUrl;
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return COVER_FALLBACKS[n % COVER_FALLBACKS.length];
}

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser(["freelancer"]);
  const { error } = await searchParams;
  const items = await listPortfolio(user.id);

  return (
    <div className="space-y-6">
      <PageTitle
        title="Портфолио"
        subtitle={`Кейсы для ставок и публичного профиля · ${items.length} ${
          items.length === 1 ? "работа" : items.length < 5 ? "работы" : "работ"
        }`}
        className="mb-0"
      />

      {error && (
        <p className="rounded-xl border border-danger/40 bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <Panel className="p-8 md:p-12">
          <div className="mx-auto flex max-w-md flex-col items-center text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border border-border bg-panel-soft text-accent">
              <FolderKanban size={24} />
            </div>
            <EmptyState
              title="Пока нет кейсов"
              hint="Добавьте первую работу — так заказчики быстрее доверяют ставке"
            />
          </div>
        </Panel>
      ) : (
        <PortfolioGallery
          items={items.map((c) => ({
            id: c.id,
            title: c.title,
            summary: c.summary,
            tags: c.tags,
            priceUsdt: c.priceUsdt,
            projectUrl: c.projectUrl,
            cover: coverFor(c.id, c.coverUrl),
          }))}
        />
      )}

      <Panel className="overflow-hidden p-0">
        <div className="flex items-center gap-3 border-b border-border px-6 py-5 md:px-8">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-accent">
            <Plus size={18} />
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold text-text">
              Новый кейс
            </h2>
            <p className="text-sm text-muted">Заполните по шагам — обязательные поля отмечены</p>
          </div>
        </div>

        <form
          action={addPortfolioAction}
          encType="multipart/form-data"
          className="grid gap-6 p-6 md:grid-cols-[1.25fr_0.75fr] md:p-8"
        >
          <div className="space-y-5">
            <fieldset className="space-y-4 rounded-2xl border border-border bg-panel-soft/30 p-4 md:p-5">
              <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-accent">
                1 · О проекте
              </legend>
              <div>
                <label className="mb-1.5 block text-sm text-text">
                  Название <span className="text-accent">*</span>
                </label>
                <Input name="title" required placeholder="Например: Лендинг для кофейни" />
                <p className="mt-1.5 text-xs text-muted">Как заказчик увидит кейс в каталоге</p>
              </div>
              <PortfolioSummaryField />
              <PortfolioCoverField />
            </fieldset>

            <fieldset className="space-y-4 rounded-2xl border border-border bg-panel-soft/30 p-4 md:p-5">
              <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-accent">
                2 · Цена и ссылка
              </legend>
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
                  <p className="mt-1.5 text-xs text-muted">Необязательно · ориентир для заказчика</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-text">Ссылка на работу</label>
                  <Input
                    name="projectUrl"
                    type="url"
                    placeholder="https://example.com"
                    inputMode="url"
                  />
                  <p className="mt-1.5 text-xs text-muted">Сайт, Behance, GitHub — что угодно</p>
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4 rounded-2xl border border-border bg-panel-soft/30 p-4 md:p-5">
              <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-accent">
                3 · Теги
              </legend>
              <div>
                <label className="mb-1.5 block text-sm text-text">Навыки и стек</label>
                <Input name="tags" placeholder="Next.js, UI, TypeScript" />
                <p className="mt-1.5 text-xs text-muted">Через запятую · например: React, Figma, API</p>
              </div>
            </fieldset>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-border bg-panel-soft/50 p-5">
              <div className="inline-flex items-center gap-2 text-accent">
                <Sparkles size={16} />
                <span className="text-sm font-semibold">Как заполнять</span>
              </div>
              <ol className="mt-4 list-decimal space-y-2.5 pl-4 text-sm leading-relaxed text-muted">
                <li>Название — короткое и конкретное</li>
                <li>Обложка сразу делает кейс заметнее</li>
                <li>Цена и ссылка повышают доверие к ставке</li>
              </ol>
            </div>
            <div className="mt-auto rounded-2xl border border-border p-5">
              <p className="text-xs text-muted">
                <span className="text-accent">*</span> — обязательные поля. Остальное можно
                дополнить позже.
              </p>
              <Button type="submit" className="mt-4 w-full !rounded-full !px-5">
                Сохранить кейс
              </Button>
              <Link
                href="/freelancer/public"
                className="mt-3 block text-center text-xs text-muted hover:text-accent"
              >
                Посмотреть публичный профиль
              </Link>
            </div>
          </div>
        </form>
      </Panel>
    </div>
  );
}

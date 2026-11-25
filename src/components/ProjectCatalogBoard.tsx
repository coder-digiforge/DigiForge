"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  ArrowLeft,
  Clock3,
  Eye,
  EyeOff,
  Flag,
  Gavel,
  Home,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
  Wallet,
  X,
} from "lucide-react";
import {
  addProjectCommentAction,
  createBidAction,
  thankProjectCommentAction,
  updateBidAction,
  withdrawBidAction,
} from "@/app/actions/marketplace";
import { FavoriteButton } from "@/components/FavoriteButton";
import { UserAvatar } from "@/components/UserAvatar";
import { Button, ButtonLink, EmptyState, Input, Panel, Textarea } from "@/components/ui";
import { formatPostedAgo } from "@/lib/project-catalog";
import type { Bid, Project, Role } from "@/lib/types";

export type ProjectBidPreview = {
  id: string;
  amount: number;
  days: number;
  comment: string;
  status: Bid["status"];
  createdAt: string;
  freelancer: {
    id: string;
    name: string;
    avatarUrl?: string;
    title?: string;
    rating: number;
    reviewCount: number;
    prime?: boolean;
  };
};

export type ProjectDiscussion = {
  id: string;
  parentId?: string | null;
  body: string;
  createdAt: string;
  thanksCount: number;
  thankedByMe?: boolean;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
    title?: string;
    role?: Role | string;
  };
};

export type ProjectCatalogItem = {
  project: Project;
  client: {
    id: string;
    name: string;
    avatarUrl?: string;
    title?: string;
    rating: number;
    reviewCount: number;
    projectsCount: number;
  } | null;
  bidCount: number;
  bids: ProjectBidPreview[];
  discussions: ProjectDiscussion[];
  myBid: Pick<Bid, "id" | "amount" | "days" | "comment" | "status"> | null;
  favorited?: boolean;
  score: number;
  views: number;
};

type Tab = "about" | "bids" | "talk";

function TabBtn({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm transition ${
        active
          ? "bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] font-semibold text-accent"
          : "text-muted hover:text-text"
      }`}
    >
      {children}
      {typeof count === "number" && (
        <span
          className={`grid min-w-[20px] place-items-center rounded-full px-1.5 text-[11px] font-bold ${
            active ? "bg-accent text-[#1a120c]" : "bg-panel-soft text-muted-2"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function SideCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-border bg-panel p-4 ${className}`}>{children}</div>;
}

export function ProjectCatalogBoard({
  items,
  variant,
  hasFilters,
  sortMatch,
  initialProjectId,
}: {
  items: ProjectCatalogItem[];
  variant: "public" | "cabinet";
  hasFilters: boolean;
  sortMatch: boolean;
  initialProjectId?: string | null;
}) {
  const titleId = useId();
  const [activeId, setActiveId] = useState<string | null>(initialProjectId ?? null);
  const [tab, setTab] = useState<Tab>("about");
  const [showBidForm, setShowBidForm] = useState(false);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const active = items.find((i) => i.project.id === activeId) ?? null;

  useEffect(() => {
    if (!activeId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeProject();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    if (!initialProjectId) return;
    setActiveId(initialProjectId);
  }, [initialProjectId]);

  useEffect(() => {
    setTab("about");
    setShowBidForm(false);
  }, [activeId]);

  const openProject = (id: string) => {
    setActiveId(id);
    setReplyToId(null);
    const url = new URL(window.location.href);
    url.searchParams.set("project", id);
    window.history.replaceState(null, "", `${url.pathname}?${url.searchParams.toString()}`);
  };

  const closeProject = () => {
    setActiveId(null);
    setShowBidForm(false);
    setReplyToId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("project");
    const qs = url.searchParams.toString();
    window.history.replaceState(null, "", qs ? `${url.pathname}?${qs}` : url.pathname);
  };

  const budgetLabel = useMemo(() => {
    if (!active) return "";
    const { budget } = active.project;
    if (budget == null || !(budget > 0)) return "Не указан";
    return `${budget.toLocaleString("ru-RU")} USDT`;
  }, [active]);

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-muted">
          Найдено <span className="font-semibold text-text">{items.length}</span>
          {hasFilters ? " по фильтрам" : " открытых проектов"}
        </p>
        {sortMatch && <p className="text-xs text-accent">Сортировка · под ваши навыки</p>}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Ничего не нашли"
          hint={
            hasFilters
              ? "Смягчите фильтры или сбросьте поиск"
              : "Скоро появятся новые открытые заказы"
          }
        />
      ) : (
        <div className="grid gap-3">
          {items.map(({ project: p, client, bidCount, myBid, score }) => (
            <button
              key={p.id}
              type="button"
              onClick={() => openProject(p.id)}
              className="group block w-full cursor-pointer text-left"
            >
              <Panel className="p-5 transition-colors group-hover:border-accent/45 md:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {score > 0 && variant === "cabinet" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] px-2.5 py-0.5 text-[11px] font-semibold text-accent">
                          <Sparkles size={11} />
                          Подходит вам
                        </span>
                      )}
                      {myBid && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-[11px] font-semibold text-muted-2">
                          <Gavel size={11} />
                          Ваша ставка
                        </span>
                      )}
                      {p.bidsHidden && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-[11px] font-semibold text-muted">
                          <EyeOff size={11} />
                          Ставки скрыты
                        </span>
                      )}
                      <span className="text-xs text-muted">{formatPostedAgo(p.createdAt)}</span>
                    </div>
                    <h2 className="mt-2 font-[family-name:var(--font-syne)] text-xl font-bold text-text transition-colors group-hover:text-accent">
                      {p.title}
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted line-clamp-2">
                      {p.description}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-border bg-panel-soft px-2.5 py-1 text-[11px] font-medium text-muted-2">
                        {p.category}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted">
                        <Clock3 size={12} />
                        {p.deadlineDays} дн.
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted">
                        <Gavel size={12} />
                        {p.bidsHidden ? "ставки скрыты" : `${bidCount} ставок`}
                      </span>
                    </div>
                    {client && (
                      <div className="mt-4 flex items-center gap-2.5">
                        <UserAvatar name={client.name} url={client.avatarUrl} size={28} />
                        <div className="min-w-0 text-sm">
                          <span className="font-medium text-text">{client.name}</span>
                          <span className="text-muted">
                            {" "}
                            · заказчик
                            {client.reviewCount > 0 ? ` · ★ ${client.rating.toFixed(1)}` : ""}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-left lg:min-w-[160px] lg:text-right">
                    <div className="font-[family-name:var(--font-syne)] text-xl font-bold text-accent">
                      {p.budget != null && p.budget > 0
                        ? p.budget.toLocaleString("ru-RU")
                        : "Не указан"}
                    </div>
                    <div className="text-xs text-muted">
                      {p.budget != null && p.budget > 0 ? "USDT · эскроу" : "цену укажет исполнитель"}
                    </div>
                    <div className="mt-4 text-xs font-medium text-accent">
                      {myBid ? "Открыть проект →" : "Смотреть и ставить →"}
                    </div>
                  </div>
                </div>
              </Panel>
            </button>
          ))}
        </div>
      )}

      {active && (
        <div className="fixed inset-0 z-[60] flex items-stretch justify-center p-0 sm:items-center sm:p-4 md:p-6">
          <button
            type="button"
            aria-label="Закрыть"
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={closeProject}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-[61] flex h-full w-full max-w-[1180px] flex-col overflow-hidden border border-border bg-bg-deep shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:h-[min(92dvh,920px)] sm:rounded-3xl"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-6">
              <button
                type="button"
                onClick={closeProject}
                className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-accent"
              >
                <ArrowLeft size={14} />
                К каталогу
              </button>
              <div className="hidden items-center gap-1.5 text-xs text-muted sm:flex">
                <Home size={12} />
                Найти проект
                <span className="text-border">/</span>
                <span className="truncate text-muted-2">{active.project.category}</span>
              </div>
              <button
                type="button"
                onClick={closeProject}
                className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted transition hover:border-accent/40 hover:text-accent"
                aria-label="Закрыть"
              >
                <X size={16} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="grid gap-5 p-4 md:p-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:gap-6">
                {/* Main */}
                <div className="min-w-0 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 max-w-3xl">
                      <h2
                        id={titleId}
                        className="font-[family-name:var(--font-syne)] text-2xl font-bold leading-tight text-text md:text-3xl"
                      >
                        {active.project.title}
                      </h2>
                      <p className="mt-1.5 text-sm text-muted">{active.project.category}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-[family-name:var(--font-syne)] text-2xl font-bold text-accent md:text-3xl">
                        {budgetLabel}
                      </div>
                      <div className="text-xs text-muted">
                        {active.project.budget != null && active.project.budget > 0
                          ? "бюджет · эскроу"
                          : "бюджет не указан"}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
                    <TabBtn active={tab === "about"} onClick={() => setTab("about")}>
                      Описание
                    </TabBtn>
                    <TabBtn
                      active={tab === "bids"}
                      onClick={() => setTab("bids")}
                      count={active.project.bidsHidden ? undefined : active.bidCount}
                    >
                      Ставки
                    </TabBtn>
                    <TabBtn
                      active={tab === "talk"}
                      onClick={() => setTab("talk")}
                      count={active.discussions.length}
                    >
                      Обсуждения
                    </TabBtn>
                  </div>

                  {tab === "about" && (
                    <div className="space-y-4">
                      <SideCard className="!bg-panel-soft/40">
                        <h3 className="font-[family-name:var(--font-syne)] text-base font-bold text-text">
                          Задача
                        </h3>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-2">
                          {active.project.description}
                        </p>
                      </SideCard>

                      {showBidForm && variant === "cabinet" && !active.myBid && (
                        <SideCard className="border-accent/35">
                          <h3 className="font-[family-name:var(--font-syne)] text-base font-bold text-text">
                            Ваша ставка
                          </h3>
                          <p className="mt-1 text-sm text-muted">
                            Контакты в тексте нельзя — заказчик увидит их после выбора.
                          </p>
                          <form action={createBidAction} className="mt-4 space-y-4">
                            <input type="hidden" name="projectId" value={active.project.id} />
                            <div>
                              <label className="mb-1.5 block text-xs font-medium text-muted">
                                Комментарий *
                              </label>
                              <Textarea
                                name="comment"
                                required
                                defaultValue="Соберу решение по брифу. Срок и правки после приёмки входят."
                              />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-1.5 block text-xs font-medium text-muted">
                                  Ваша ставка USDT *
                                </label>
                                <Input
                                  name="amount"
                                  type="number"
                                  min={1}
                                  step="1"
                                  required
                                  defaultValue={
                                    active.project.budget != null && active.project.budget > 0
                                      ? active.project.budget
                                      : undefined
                                  }
                                  placeholder="Ваша цена за работу"
                                />
                              </div>
                              <div>
                                <label className="mb-1.5 block text-xs font-medium text-muted">
                                  Срок, дней *
                                </label>
                                <Input
                                  name="days"
                                  type="number"
                                  required
                                  defaultValue={Math.min(active.project.deadlineDays, 14)}
                                />
                              </div>
                            </div>
                            <div className="space-y-2 text-sm text-muted-2">
                              <label className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name="transferCopyright"
                                  value="keep"
                                  defaultChecked
                                />
                                Не передаю авторские права
                              </label>
                              <label className="flex items-center gap-2">
                                <input type="radio" name="transferCopyright" value="license" />
                                Передаю авторские права по лицензии
                              </label>
                            </div>
                            <label className="flex items-center gap-2 text-sm text-muted-2">
                              <input type="checkbox" name="hideFromOthers" />
                              Скрыть ставку от других исполнителей
                            </label>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="submit"
                                className="!rounded-full shadow-[var(--df-glow)]"
                              >
                                Отправить ставку
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                className="!rounded-full"
                                onClick={() => setShowBidForm(false)}
                              >
                                Отмена
                              </Button>
                            </div>
                          </form>
                        </SideCard>
                      )}

                      {variant === "cabinet" &&
                        active.myBid &&
                        active.myBid.status === "pending" && (
                          <SideCard className="border-accent/35">
                            <h3 className="font-[family-name:var(--font-syne)] text-base font-bold text-text">
                              Ваша ставка · изменить
                            </h3>
                            <form action={updateBidAction} className="mt-4 space-y-4">
                              <input type="hidden" name="bidId" value={active.myBid.id} />
                              <input type="hidden" name="projectId" value={active.project.id} />
                              <div>
                                <label className="mb-1.5 block text-xs font-medium text-muted">
                                  Комментарий *
                                </label>
                                <Textarea
                                  name="comment"
                                  required
                                  defaultValue={active.myBid.comment}
                                />
                              </div>
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                  <label className="mb-1.5 block text-xs font-medium text-muted">
                                    Ставка USDT *
                                  </label>
                                  <Input
                                    name="amount"
                                    type="number"
                                    min={1}
                                    required
                                    defaultValue={active.myBid.amount}
                                  />
                                </div>
                                <div>
                                  <label className="mb-1.5 block text-xs font-medium text-muted">
                                    Срок, дней *
                                  </label>
                                  <Input
                                    name="days"
                                    type="number"
                                    required
                                    defaultValue={active.myBid.days}
                                  />
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Button type="submit" className="!rounded-full">
                                  Сохранить
                                </Button>
                              </div>
                            </form>
                            <form action={withdrawBidAction} className="mt-3">
                              <input type="hidden" name="bidId" value={active.myBid.id} />
                              <Button type="submit" variant="ghost" className="!text-danger">
                                Отозвать ставку
                              </Button>
                            </form>
                          </SideCard>
                        )}
                    </div>
                  )}

                  {tab === "bids" && (
                    <div className="space-y-3">
                      {active.project.bidsHidden ? (
                        <EmptyState
                          title="Ставки скрыты"
                          hint="Заказчик откроет список после выбора исполнителя"
                        />
                      ) : active.bids.length === 0 ? (
                        <EmptyState
                          title="Пока нет ставок"
                          hint="Будьте первым — предложите условия"
                        />
                      ) : (
                        active.bids.map((b) => (
                          <SideCard key={b.id} className="!p-4 md:!p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <UserAvatar
                                  name={b.freelancer.name}
                                  url={b.freelancer.avatarUrl}
                                  size={44}
                                />
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-semibold text-text">
                                      {b.freelancer.name}
                                    </span>
                                    {b.freelancer.prime && (
                                      <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 px-2 py-0.5 text-[10px] font-semibold text-accent">
                                        <Sparkles size={10} />
                                        Prime
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                                    <span>{b.freelancer.title || "Фрилансер"}</span>
                                    <span className="inline-flex items-center gap-1">
                                      <Star size={11} className="fill-accent text-accent" />
                                      {b.freelancer.rating.toFixed(1)}
                                    </span>
                                    <span>{b.freelancer.reviewCount} отзывов</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right text-sm">
                                <div className="font-semibold text-accent">
                                  {b.amount.toLocaleString("ru-RU")} USDT
                                </div>
                                <div className="text-xs text-muted">{b.days} дн.</div>
                              </div>
                            </div>
                            <p className="mt-3 text-sm leading-relaxed text-muted-2">{b.comment}</p>
                            <div className="mt-3 text-[11px] text-muted">
                              {formatPostedAgo(b.createdAt)}
                            </div>
                          </SideCard>
                        ))
                      )}
                    </div>
                  )}

                  {tab === "talk" && (
                    <ProjectDiscussionTab
                      projectId={active.project.id}
                      discussions={active.discussions}
                      variant={variant}
                      replyToId={replyToId}
                      setReplyToId={setReplyToId}
                      onViewBids={() => setTab("bids")}
                      onBid={() => {
                        setTab("about");
                        setShowBidForm(true);
                      }}
                      canBid={variant === "cabinet" && !active.myBid}
                    />
                  )}
                </div>

                {/* Sidebar */}
                <aside className="space-y-3 xl:sticky xl:top-0 xl:self-start">
                  <SideCard>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-text">
                          {active.project.status === "open" ? "Приём ставок" : active.project.status}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                          В процессе · эскроу DigiForge
                        </div>
                      </div>
                      <div className="grid h-12 w-12 place-items-center rounded-full border border-accent/35 text-xs font-bold text-accent">
                        {Math.min(active.bidCount, 9)}
                        <span className="text-[9px] font-medium text-muted">bid</span>
                      </div>
                    </div>
                  </SideCard>

                  {variant === "cabinet" ? (
                    active.myBid ? (
                      <SideCard className="border-accent/40">
                        <div className="text-xs font-medium uppercase tracking-wider text-muted">
                          Ваша ставка
                        </div>
                        <div className="mt-2 font-[family-name:var(--font-syne)] text-xl font-bold text-accent">
                          {active.myBid.amount.toLocaleString("ru-RU")} USDT
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          {active.myBid.days} дн. · {active.myBid.status}
                        </p>
                        <ButtonLink
                          href="/freelancer/bids"
                          variant="ghost"
                          className="mt-3 w-full !rounded-full !text-sm"
                        >
                          Мои ставки
                        </ButtonLink>
                      </SideCard>
                    ) : (
                      <Button
                        type="button"
                        className="w-full !rounded-full !py-3 shadow-[var(--df-glow)]"
                        onClick={() => {
                          setTab("about");
                          setShowBidForm(true);
                        }}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Gavel size={16} />
                          Сделать ставку
                        </span>
                      </Button>
                    )
                  ) : (
                    <ButtonLink href="/login" className="w-full !rounded-full !py-3 !text-center">
                      Войти и сделать ставку
                    </ButtonLink>
                  )}

                  {variant === "cabinet" && (
                    <FavoriteButton
                      targetType="project"
                      targetId={active.project.id}
                      favorited={Boolean(active.favorited)}
                      returnTo={`/freelancer/projects?project=${encodeURIComponent(active.project.id)}`}
                    />
                  )}

                  {active.client && (
                    <SideCard>
                      <div className="text-[11px] font-medium uppercase tracking-wider text-muted">
                        Заказчик
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <UserAvatar
                          name={active.client.name}
                          url={active.client.avatarUrl}
                          size={48}
                        />
                        <div className="min-w-0">
                          <a
                            href={`/clients/${active.client.id}`}
                            className="font-semibold text-text hover:text-accent"
                          >
                            {active.client.name}
                          </a>
                          <div className="text-xs text-muted">
                            {active.client.title || "Заказчик DigiForge"}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl border border-border bg-panel-soft/50 px-2 py-2">
                          <div className="text-sm font-semibold text-text">
                            {active.client.projectsCount}
                          </div>
                          <div className="text-[10px] text-muted">проектов</div>
                        </div>
                        <div className="rounded-xl border border-border bg-panel-soft/50 px-2 py-2">
                          <div className="inline-flex items-center justify-center gap-0.5 text-sm font-semibold text-text">
                            <Star size={11} className="fill-accent text-accent" />
                            {active.client.rating.toFixed(1)}
                          </div>
                          <div className="text-[10px] text-muted">рейтинг</div>
                        </div>
                        <div className="rounded-xl border border-border bg-panel-soft/50 px-2 py-2">
                          <div className="text-sm font-semibold text-text">
                            {active.client.reviewCount}
                          </div>
                          <div className="text-[10px] text-muted">отзывов</div>
                        </div>
                      </div>
                    </SideCard>
                  )}

                  <SideCard className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-muted">
                        <Clock3 size={13} />
                        Опубликован
                      </span>
                      <span className="text-text">{formatPostedAgo(active.project.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-muted">
                        <Wallet size={13} />
                        Срок работы
                      </span>
                      <span className="text-text">{active.project.deadlineDays} дн.</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-muted">
                        <Eye size={13} />
                        Просмотры
                      </span>
                      <span className="text-text">{active.views}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-muted">
                        <ShieldCheck size={13} />
                        Комиссия
                      </span>
                      <span className="text-text">10% при релизе</span>
                    </div>
                  </SideCard>

                  <SideCard>
                    <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted">
                      <Flag size={12} />
                      Сообщить
                    </div>
                    <p className="mb-3 text-xs leading-relaxed text-muted">
                      Если бюджет занижен или ТЗ нарушает правила — отметьте для модерации.
                    </p>
                    <div className="grid gap-2">
                      <button
                        type="button"
                        className="rounded-xl border border-border px-3 py-2 text-left text-sm text-muted-2 transition hover:border-accent/40 hover:text-text"
                      >
                        Заниженный бюджет
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border border-border px-3 py-2 text-left text-sm text-muted-2 transition hover:border-accent/40 hover:text-text"
                      >
                        Нарушение
                      </button>
                    </div>
                  </SideCard>

                  <SideCard>
                    <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted">
                      Теги
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="rounded-full border border-border bg-panel-soft px-2.5 py-1 text-[11px] text-muted-2">
                        {active.project.category}
                      </span>
                      <span className="rounded-full border border-border bg-panel-soft px-2.5 py-1 text-[11px] text-muted-2">
                        USDT
                      </span>
                      <span className="rounded-full border border-border bg-panel-soft px-2.5 py-1 text-[11px] text-muted-2">
                        эскроу
                      </span>
                      {active.project.bidsHidden && (
                        <span className="rounded-full border border-border bg-panel-soft px-2.5 py-1 text-[11px] text-muted-2">
                          скрытые ставки
                        </span>
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

function ProjectDiscussionTab({
  projectId,
  discussions,
  variant,
  replyToId,
  setReplyToId,
  onViewBids,
  onBid,
  canBid,
}: {
  projectId: string;
  discussions: ProjectDiscussion[];
  variant: "public" | "cabinet";
  replyToId: string | null;
  setReplyToId: (id: string | null) => void;
  onViewBids: () => void;
  onBid: () => void;
  canBid: boolean;
}) {
  const returnTo =
    variant === "cabinet"
      ? `/freelancer/projects?project=${encodeURIComponent(projectId)}`
      : `/projects?project=${encodeURIComponent(projectId)}`;

  const roots = discussions.filter((d) => !d.parentId);
  const repliesOf = (id: string) => discussions.filter((d) => d.parentId === id);

  function CommentCard({
    d,
    nested = false,
  }: {
    d: ProjectDiscussion;
    nested?: boolean;
  }) {
    return (
      <SideCard className={nested ? "ml-6 !bg-panel-soft/40 md:ml-10" : ""}>
        <div className="flex items-start gap-3">
          <UserAvatar name={d.author.name} url={d.author.avatarUrl} size={40} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <span className="text-sm font-semibold text-text">{d.author.name}</span>
                {d.author.title && (
                  <span className="ml-2 text-xs text-muted">{d.author.title}</span>
                )}
              </div>
              <span className="text-[11px] text-muted">{formatPostedAgo(d.createdAt)}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-2">
              {d.body}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
              {variant === "cabinet" ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 transition hover:text-accent"
                  onClick={() => setReplyToId(replyToId === d.id ? null : d.id)}
                >
                  <MessageCircle size={12} />
                  Ответить
                </button>
              ) : (
                <ButtonLink
                  href={`/login?next=${encodeURIComponent(returnTo)}`}
                  variant="ghost"
                  className="!inline-flex !h-auto !items-center !gap-1 !rounded-none !border-0 !p-0 !text-xs !text-muted hover:!text-accent"
                >
                  <MessageCircle size={12} />
                  Ответить
                </ButtonLink>
              )}
              {variant === "cabinet" ? (
                <form action={thankProjectCommentAction} className="inline">
                  <input type="hidden" name="commentId" value={d.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <button
                    type="submit"
                    className={`inline-flex items-center gap-1 transition hover:text-accent ${
                      d.thankedByMe ? "text-accent" : ""
                    }`}
                  >
                    <ThumbsUp size={12} className={d.thankedByMe ? "fill-accent" : ""} />
                    Поблагодарить
                    {d.thanksCount > 0 ? ` · ${d.thanksCount}` : ""}
                  </button>
                </form>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <ThumbsUp size={12} />
                  {d.thanksCount > 0 ? d.thanksCount : "0"}
                </span>
              )}
            </div>
            {variant === "cabinet" && replyToId === d.id && (
              <form action={addProjectCommentAction} className="mt-3 space-y-2">
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="parentId" value={d.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <Textarea
                  name="body"
                  required
                  placeholder={`Ответ для ${d.author.name}…`}
                  className="min-h-[72px]"
                />
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" className="!rounded-full !text-sm">
                    Отправить
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="!rounded-full !text-sm"
                    onClick={() => setReplyToId(null)}
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </SideCard>
    );
  }

  return (
    <div className="space-y-3">
      {roots.length === 0 ? (
        <EmptyState
          title="Пока тихо"
          hint="Уточняющие вопросы появятся здесь — напишите первый комментарий"
        />
      ) : (
        roots.map((root) => (
          <div key={root.id} className="space-y-2">
            <CommentCard d={root} />
            {repliesOf(root.id).map((r) => (
              <CommentCard key={r.id} d={r} nested />
            ))}
          </div>
        ))
      )}

      {variant === "cabinet" ? (
        <SideCard className="border-accent/30">
          <h3 className="font-[family-name:var(--font-syne)] text-sm font-bold text-text">
            Добавить комментарий
          </h3>
          <form action={addProjectCommentAction} className="mt-3 space-y-3">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <Textarea
              name="body"
              required
              placeholder="Задайте уточняющий вопрос по проекту…"
              className="min-h-[96px]"
            />
            <Button type="submit" className="!rounded-full shadow-[var(--df-glow)]">
              <span className="inline-flex items-center gap-2">
                <MessageCircle size={14} />
                Добавить комментарий
              </span>
            </Button>
          </form>
        </SideCard>
      ) : (
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <ButtonLink
            href={`/login?next=${encodeURIComponent(returnTo)}`}
            className="!rounded-full !text-sm"
          >
            Войти, чтобы комментировать
          </ButtonLink>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          className="!rounded-full !text-sm"
          onClick={onViewBids}
        >
          Смотреть ставки
        </Button>
        {canBid && (
          <Button type="button" className="!rounded-full !text-sm" onClick={onBid}>
            Сделать ставку
          </Button>
        )}
      </div>
    </div>
  );
}

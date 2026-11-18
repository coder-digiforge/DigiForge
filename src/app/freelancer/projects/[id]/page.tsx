import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock3,
  EyeOff,
  Gavel,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { createBidAction } from "@/app/actions/marketplace";
import { UserAvatar } from "@/components/UserAvatar";
import { Button, ButtonLink, Input, PageTitle, Panel, Textarea } from "@/components/ui";
import { formatPostedAgo } from "@/lib/project-catalog";
import { requireUser } from "@/lib/auth";
import { findUserById, getProject, listBidsForProject } from "@/lib/store";

export default async function FreelancerProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser(["freelancer"]);
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  const bids = await listBidsForProject(id);
  const myBid = bids.find((b) => b.freelancerId === user.id);
  const client = await findUserById(project.clientId);
  const mid = Math.round((project.budgetMin + project.budgetMax) / 2);

  return (
    <div className="space-y-5">
      <Link
        href="/freelancer/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-accent"
      >
        <ArrowLeft size={14} />
        Назад к каталогу
      </Link>

      <PageTitle
        title={project.title}
        subtitle={`${project.category} · опубликовано ${formatPostedAgo(project.createdAt)}`}
        className="mb-0"
        action={
          project.status === "open" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-1.5 text-xs font-semibold text-accent">
              Открыт для ставок
            </span>
          ) : (
            <span className="inline-flex rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted">
              {project.status}
            </span>
          )
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.8fr)]">
        <div className="space-y-4">
          <Panel className="p-5 md:p-6">
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
              Описание
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-2">
              {project.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-border bg-panel-soft px-3 py-1 text-xs font-medium text-muted-2">
                {project.category}
              </span>
              {project.bidsHidden && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted">
                  <EyeOff size={12} />
                  Ставки скрыты
                </span>
              )}
            </div>
          </Panel>

          {myBid ? (
            <Panel className="border-accent/40 p-5 md:p-6">
              <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                Ваша ставка
              </h2>
              <p className="mt-2 text-sm text-muted-2">
                {myBid.amount.toLocaleString("ru-RU")} USDT · {myBid.days} дн. · статус{" "}
                <span className="font-semibold text-accent">{myBid.status}</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{myBid.comment}</p>
              <div className="mt-4">
                <ButtonLink href="/freelancer/bids" variant="ghost" className="!rounded-full">
                  Все мои ставки
                </ButtonLink>
              </div>
            </Panel>
          ) : project.status === "open" ? (
            <Panel className="p-5 md:p-6">
              <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-text">
                Публикация ставки
              </h2>
              <p className="mt-1 text-sm text-muted">
                Контакты в тексте нельзя — заказчик увидит их после выбора.
              </p>
              <form action={createBidAction} className="mt-5 space-y-4">
                <input type="hidden" name="projectId" value={project.id} />
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
                      Стоимость USDT *
                    </label>
                    <Input name="amount" type="number" required defaultValue={mid} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted">
                      Срок, дней *
                    </label>
                    <Input
                      name="days"
                      type="number"
                      required
                      defaultValue={Math.min(project.deadlineDays, 14)}
                    />
                  </div>
                </div>
                <div className="space-y-2 text-sm text-muted-2">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="transferCopyright" value="keep" defaultChecked />
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
                <Button type="submit" className="!rounded-full shadow-[var(--df-glow)]">
                  Сделать ставку
                </Button>
              </form>
            </Panel>
          ) : (
            <Panel className="p-5 md:p-6">
              <p className="text-sm text-muted">Этот проект больше не принимает ставки.</p>
            </Panel>
          )}
        </div>

        <div className="space-y-4">
          <Panel className="p-5 md:p-6">
            <div className="flex items-center gap-2 text-xs text-muted">
              <Wallet size={14} className="text-accent" />
              Бюджет
            </div>
            <div className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-accent">
              {project.budgetMin.toLocaleString("ru-RU")}–{project.budgetMax.toLocaleString("ru-RU")}
            </div>
            <div className="text-xs text-muted">USDT · эскроу до приёмки</div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-border bg-panel-soft/50 px-3.5 py-2.5 text-sm">
                <span className="inline-flex items-center gap-1.5 text-muted-2">
                  <Clock3 size={14} />
                  Срок
                </span>
                <span className="font-semibold text-text">{project.deadlineDays} дн.</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border bg-panel-soft/50 px-3.5 py-2.5 text-sm">
                <span className="inline-flex items-center gap-1.5 text-muted-2">
                  <Gavel size={14} />
                  Ставки
                </span>
                <span className="font-semibold text-text">
                  {project.bidsHidden ? "скрыты" : bids.length}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border bg-panel-soft/50 px-3.5 py-2.5 text-sm">
                <span className="inline-flex items-center gap-1.5 text-muted-2">
                  <ShieldCheck size={14} />
                  Комиссия
                </span>
                <span className="font-semibold text-text">10% при релизе</span>
              </div>
            </div>
          </Panel>

          {client && (
            <Panel className="p-5 md:p-6">
              <div className="text-xs font-medium uppercase tracking-wider text-muted">
                Заказчик
              </div>
              <div className="mt-3 flex items-center gap-3">
                <UserAvatar name={client.name} url={client.avatarUrl} size={44} />
                <div className="min-w-0">
                  <div className="font-semibold text-text">{client.name}</div>
                  <div className="text-xs text-muted">
                    {client.title || "Заказчик"}
                    {client.reviewCount > 0
                      ? ` · ★ ${client.rating.toFixed(1)} · ${client.reviewCount} отзывов`
                      : ""}
                  </div>
                </div>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

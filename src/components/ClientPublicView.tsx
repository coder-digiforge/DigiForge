import Link from "next/link";
import { UserAvatar } from "@/components/UserAvatar";
import { Chip, Panel } from "@/components/ui";
import { formatProjectBudget } from "@/lib/project-budget";
import type { Project, Review, User } from "@/lib/types";

export function ClientPublicView({
  user,
  projects,
  reviews,
  reviewAuthors,
  basePath = "/clients",
  variant = "public",
}: {
  user: User;
  projects: Project[];
  reviews: Review[];
  reviewAuthors: Record<string, string>;
  basePath?: string;
  variant?: "public" | "cabinet";
}) {
  const open = projects.filter((p) => p.status === "open");
  const wrap =
    variant === "public" ? "mx-auto max-w-5xl px-6 py-12 md:px-12" : "space-y-6";

  return (
    <div className={wrap}>
      <Link href={variant === "public" ? "/projects" : "/client/projects"} className="text-sm text-accent">
        ← Назад
      </Link>
      <Panel className={`${variant === "public" ? "mt-6" : "mt-4"} p-6 md:p-8`}>
        <div className="flex flex-wrap items-start gap-4">
          <UserAvatar name={user.name} url={user.avatarUrl} size={72} />
          <div className="min-w-0 flex-1">
            <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-text">
              {user.name}
            </h1>
            <p className="mt-1 text-sm text-muted">{user.title || "Заказчик"}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip>
                ★ {user.rating.toFixed(1)} · {user.reviewCount} отзывов
              </Chip>
              <Chip>{projects.length} проектов</Chip>
              <Chip>на DigiForge с {new Date(user.createdAt).toLocaleDateString("ru-RU")}</Chip>
            </div>
          </div>
        </div>
        {user.bio && <p className="mt-5 text-sm leading-relaxed text-muted-2">{user.bio}</p>}
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel className="p-6">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
            Открытые проекты
          </h2>
          <div className="mt-4 space-y-3">
            {open.length === 0 && <p className="text-sm text-muted">Нет открытых проектов</p>}
            {open.map((p) => (
              <Link
                key={p.id}
                href={
                  variant === "cabinet"
                    ? `/client/projects/${p.id}`
                    : `/projects/${p.id}`
                }
                className="block rounded-xl border border-border p-4 transition hover:border-accent/40"
              >
                <div className="font-semibold text-text">{p.title}</div>
                <div className="mt-1 text-xs text-muted">
                  {formatProjectBudget(p)} · {p.category}
                </div>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel className="p-6">
          <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold">Отзывы</h2>
          <div className="mt-4 space-y-3">
            {reviews.length === 0 && <p className="text-sm text-muted">Пока нет отзывов</p>}
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-border p-4">
                <div className="text-sm font-semibold">
                  ★ {r.rating} · {reviewAuthors[r.fromUserId] ?? "Исполнитель"}
                </div>
                <p className="mt-2 text-sm text-muted">{r.text}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <p className="mt-4 text-xs text-muted">Профиль: {basePath}/{user.id}</p>
    </div>
  );
}

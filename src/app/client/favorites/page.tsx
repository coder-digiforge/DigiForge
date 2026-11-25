import Link from "next/link";
import { FavoriteButton } from "@/components/FavoriteButton";
import { EmptyState, PageTitle, Panel } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatProjectBudget } from "@/lib/project-budget";
import { findUserById, getProject, listFavorites } from "@/lib/store";

export default async function ClientFavoritesPage() {
  const user = await requireUser(["client"]);
  const favorites = await listFavorites(user.id);

  const rows = await Promise.all(
    favorites.map(async (f) => {
      if (f.targetType === "project") {
        const project = await getProject(f.targetId);
        return { fav: f, project, freelancer: null };
      }
      const freelancer = await findUserById(f.targetId);
      return { fav: f, project: null, freelancer };
    }),
  );

  return (
    <Panel className="p-6 md:p-8">
      <PageTitle title="Избранное" subtitle="Сохранённые проекты и исполнители" />
      {rows.length === 0 ? (
        <EmptyState title="Пока пусто" hint="Добавляйте закладки со страниц проектов и фрилансеров" />
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map(({ fav, project, freelancer }) => (
            <div
              key={fav.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
            >
              <div className="min-w-0">
                {project ? (
                  <>
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-semibold text-text hover:text-accent"
                    >
                      {project.title}
                    </Link>
                    <div className="mt-1 text-xs text-muted">
                      Проект · {formatProjectBudget(project)} · {project.category}
                    </div>
                  </>
                ) : freelancer ? (
                  <>
                    <Link
                      href={`/client/freelancers/${freelancer.id}`}
                      className="font-semibold text-text hover:text-accent"
                    >
                      {freelancer.name}
                    </Link>
                    <div className="mt-1 text-xs text-muted">
                      Фрилансер · {freelancer.title || "исполнитель"}
                    </div>
                  </>
                ) : (
                  <span className="text-sm text-muted">Удалено</span>
                )}
              </div>
              <FavoriteButton
                targetType={fav.targetType}
                targetId={fav.targetId}
                favorited
                returnTo="/client/favorites"
              />
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

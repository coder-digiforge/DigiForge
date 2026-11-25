import Link from "next/link";
import { FavoriteButton } from "@/components/FavoriteButton";
import { EmptyState, PageTitle, Panel } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatProjectBudget } from "@/lib/project-budget";
import { getProject, listFavorites } from "@/lib/store";

export default async function FreelancerFavoritesPage() {
  const user = await requireUser(["freelancer"]);
  const favorites = (await listFavorites(user.id)).filter((f) => f.targetType === "project");

  const rows = await Promise.all(
    favorites.map(async (f) => {
      const project = await getProject(f.targetId);
      return { fav: f, project };
    }),
  );

  return (
    <Panel className="p-6 md:p-8">
      <PageTitle title="Избранное" subtitle="Сохранённые проекты" />
      {rows.length === 0 ? (
        <EmptyState title="Пока пусто" hint="Добавляйте проекты в избранное из каталога" />
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map(({ fav, project }) => (
            <div
              key={fav.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
            >
              <div className="min-w-0">
                {project ? (
                  <>
                    <Link
                      href={`/freelancer/projects?project=${encodeURIComponent(project.id)}`}
                      className="font-semibold text-text hover:text-accent"
                    >
                      {project.title}
                    </Link>
                    <div className="mt-1 text-xs text-muted">
                      {formatProjectBudget(project)} · {project.category}
                    </div>
                  </>
                ) : (
                  <span className="text-sm text-muted">Проект удалён</span>
                )}
              </div>
              <FavoriteButton
                targetType="project"
                targetId={fav.targetId}
                favorited
                returnTo="/freelancer/favorites"
              />
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

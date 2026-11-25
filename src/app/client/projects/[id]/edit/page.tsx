import { notFound } from "next/navigation";
import { updateProjectAction } from "@/app/actions/marketplace";
import { Button, ButtonLink, Input, PageTitle, Panel, Textarea } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getProject } from "@/lib/store";

export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser(["client"]);
  const { id } = await params;
  const { error } = await searchParams;
  const project = await getProject(id);
  if (!project || project.clientId !== user.id) notFound();
  if (project.status !== "open") {
    return (
      <Panel className="p-6 md:p-8">
        <PageTitle title="Редактирование недоступно" subtitle="Менять можно только открытый проект" />
        <ButtonLink href={`/client/projects/${project.id}`}>К проекту</ButtonLink>
      </Panel>
    );
  }

  const keepAttachments = JSON.stringify(project.attachments ?? []);

  return (
    <Panel className="p-6 md:p-8">
      <PageTitle title="Редактировать проект" subtitle={project.title} />
      {error && <p className="mb-4 text-sm text-danger">{error}</p>}
      <form action={updateProjectAction} className="max-w-2xl space-y-4" encType="multipart/form-data">
        <input type="hidden" name="projectId" value={project.id} />
        <input type="hidden" name="keepAttachments" value={keepAttachments} />
        <div>
          <label className="mb-1 block text-sm text-muted">Название</label>
          <Input name="title" required defaultValue={project.title} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Описание</label>
          <Textarea name="description" required defaultValue={project.description} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Категория</label>
          <select name="category" className="df-input" defaultValue={project.category}>
            <option>Сайты и лендинги</option>
            <option>Мобильные приложения</option>
            <option>UI/UX дизайн</option>
            <option>AI и автоматизация</option>
            <option>Маркетинг и рост</option>
            <option>Стратегия продукта</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Навыки</label>
          <Input name="skills" defaultValue={(project.skills ?? []).join(", ")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted">Бюджет USDT</label>
            <Input
              name="budget"
              type="number"
              min={1}
              defaultValue={project.budget ?? undefined}
              placeholder="Пусто = не указан"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Срок, дней</label>
            <Input name="deadlineDays" type="number" required defaultValue={project.deadlineDays} />
          </div>
        </div>
        {(project.attachments?.length ?? 0) > 0 && (
          <div className="rounded-xl border border-border p-3 text-sm text-muted">
            Текущие вложения сохранятся:{" "}
            {(project.attachments ?? []).map((a) => a.name).join(", ")}
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm text-muted">Добавить вложения</label>
          <input
            name="attachments"
            type="file"
            multiple
            className="df-input block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-panel-soft file:px-3 file:py-1.5"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-2">
          <input type="checkbox" name="bidsHidden" defaultChecked={project.bidsHidden} />
          Скрыть ставки от других фрилансеров
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="submit">Сохранить</Button>
          <ButtonLink href={`/client/projects/${project.id}`} variant="ghost">
            Отмена
          </ButtonLink>
        </div>
      </form>
    </Panel>
  );
}

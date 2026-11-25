import { createProjectAction } from "@/app/actions/marketplace";
import { Button, Input, PageTitle, Panel, Textarea } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireUser(["client"]);
  const { error } = await searchParams;

  return (
    <Panel className="p-6 md:p-8">
      <PageTitle
        title="Новый проект"
        subtitle="Опишите задачу. Бюджет можно указать фиксированно или оставить пустым — цену предложит фрилансер"
      />
      {error && <p className="mb-4 text-sm text-danger">{error}</p>}
      <form action={createProjectAction} className="max-w-2xl space-y-4" encType="multipart/form-data">
        <div>
          <label className="mb-1 block text-sm text-muted">Название</label>
          <Input name="title" required placeholder="Лендинг для кофейни" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Описание</label>
          <Textarea name="description" required placeholder="Что нужно сделать…" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Категория</label>
          <select name="category" className="df-input" defaultValue="Сайты и лендинги">
            <option>Сайты и лендинги</option>
            <option>Мобильные приложения</option>
            <option>UI/UX дизайн</option>
            <option>AI и автоматизация</option>
            <option>Маркетинг и рост</option>
            <option>Стратегия продукта</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">
            Навыки <span className="text-muted-2">(через запятую)</span>
          </label>
          <Input name="skills" placeholder="React, Next.js, Figma" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted">
              Бюджет USDT <span className="text-muted-2">(необязательно)</span>
            </label>
            <Input
              name="budget"
              type="number"
              min={1}
              step="1"
              placeholder="Например 1500 — или оставьте пустым"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Срок, дней</label>
            <Input name="deadlineDays" type="number" required defaultValue={14} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">
            Вложения к ТЗ <span className="text-muted-2">(до 5 файлов)</span>
          </label>
          <input
            name="attachments"
            type="file"
            multiple
            className="df-input block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-panel-soft file:px-3 file:py-1.5"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-2">
          <input type="checkbox" name="bidsHidden" />
          Скрыть ставки от других фрилансеров
        </label>
        <Button type="submit">Опубликовать</Button>
      </form>
    </Panel>
  );
}

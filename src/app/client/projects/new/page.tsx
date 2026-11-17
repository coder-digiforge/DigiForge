import { createProjectAction } from "@/app/actions/marketplace";
import { Button, Input, PageTitle, Panel, Textarea } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export default async function NewProjectPage() {
  await requireUser(["client"]);

  return (
    <Panel className="p-6 md:p-8">
      <PageTitle title="Новый проект" subtitle="Опишите задачу и бюджет в USDT" />
      <form action={createProjectAction} className="max-w-2xl space-y-4">
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
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm text-muted">Бюджет от</label>
            <Input name="budgetMin" type="number" required defaultValue={500} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Бюджет до</label>
            <Input name="budgetMax" type="number" required defaultValue={1500} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted">Срок, дней</label>
            <Input name="deadlineDays" type="number" required defaultValue={14} />
          </div>
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

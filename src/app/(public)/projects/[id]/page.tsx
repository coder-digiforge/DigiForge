import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink, Chip, Panel } from "@/components/ui";
import { findUserById, getProject, listBidsForProject } from "@/lib/store";

export default async function PublicProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  const client = await findUserById(project.clientId);
  const bids = await listBidsForProject(id);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:px-12">
      <Link href="/projects" className="text-sm text-accent">
        ← Все проекты
      </Link>
      <h1 className="mt-4 font-[family-name:var(--font-syne)] text-3xl font-bold">
        {project.title}
      </h1>
      <div className="mt-3 flex flex-wrap gap-2">
        <Chip>{project.category}</Chip>
        <Chip>
          {project.budgetMin}–{project.budgetMax} USDT
        </Chip>
        <Chip>{project.deadlineDays} дней</Chip>
      </div>
      <Panel className="mt-8 p-6">
        <p className="leading-relaxed text-muted-2">{project.description}</p>
        <div className="mt-6 text-sm text-muted">Заказчик: {client?.name}</div>
        <div className="mt-2 text-sm text-muted">
          Ставок: {project.bidsHidden ? "скрыты до выбора" : bids.length}
        </div>
        <div className="mt-6">
          <ButtonLink href={`/login`}>Откликнуться</ButtonLink>
        </div>
      </Panel>
    </div>
  );
}

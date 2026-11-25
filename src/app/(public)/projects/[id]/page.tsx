import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink, Chip, Panel } from "@/components/ui";
import { formatProjectBudget } from "@/lib/project-budget";
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
        <Chip>{formatProjectBudget(project)}</Chip>
        <Chip>{project.deadlineDays} дней</Chip>
      </div>
      {(project.skills?.length ?? 0) > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.skills!.map((s) => (
            <span
              key={s}
              className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-2"
            >
              {s}
            </span>
          ))}
        </div>
      )}
      <Panel className="mt-8 p-6">
        <p className="leading-relaxed text-muted-2">{project.description}</p>
        {(project.attachments?.length ?? 0) > 0 && (
          <div className="mt-4 space-y-1 text-sm">
            {project.attachments!.map((a) => (
              <a key={a.url} href={a.url} className="block text-accent hover:underline">
                {a.name}
              </a>
            ))}
          </div>
        )}
        <div className="mt-6 text-sm text-muted">
          Заказчик:{" "}
          {client ? (
            <Link href={`/clients/${client.id}`} className="text-accent hover:underline">
              {client.name}
            </Link>
          ) : (
            "—"
          )}
        </div>
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

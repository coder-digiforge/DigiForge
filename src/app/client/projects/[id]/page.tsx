import { acceptBidAction } from "@/app/actions/marketplace";
import { Button, Chip, PageTitle, Panel } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getDb, getProject, listBidsForProject } from "@/lib/store";
import { notFound } from "next/navigation";

export default async function ClientProjectDetailPage({
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
  const bids = await listBidsForProject(id);
  const db = await getDb();

  return (
    <Panel className="p-6 md:p-8">
      <PageTitle title={project.title} subtitle={project.description} />
      <div className="flex flex-wrap gap-2">
        <Chip>{project.status}</Chip>
        <Chip>
          {project.budgetMin}–{project.budgetMax} USDT
        </Chip>
        <Chip>{project.category}</Chip>
      </div>
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      <h2 className="mt-8 font-[family-name:var(--font-syne)] text-lg font-semibold">Ставки</h2>
      <div className="mt-4 space-y-3">
        {bids.map((b) => {
          const fl = db.users.find((u) => u.id === b.freelancerId);
          return (
            <div key={b.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">
                    {fl?.name} · {b.amount} USDT · {b.days} дн.
                  </div>
                  <p className="mt-2 text-sm text-muted">{b.comment}</p>
                  <div className="mt-2 text-xs text-muted">Статус: {b.status}</div>
                </div>
                {project.status === "open" && b.status === "pending" && (
                  <form action={acceptBidAction}>
                    <input type="hidden" name="projectId" value={project.id} />
                    <input type="hidden" name="bidId" value={b.id} />
                    <Button type="submit">Принять и открыть эскроу</Button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

import Link from "next/link";
import { Chip, PageTitle, Panel } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { listProjects } from "@/lib/store";

export default async function FreelancerProjectsSearchPage() {
  await requireUser(["freelancer"]);
  const projects = (await listProjects()).filter((p) => p.status === "open");

  return (
    <Panel className="p-6 md:p-8">
      <PageTitle title="Поиск проектов" subtitle="Открытые заказы для ставок" />
      <div className="space-y-3">
        {projects.map((p) => (
          <Link
            key={p.id}
            href={`/freelancer/projects/${p.id}`}
            className="block rounded-xl border border-border p-4 hover:border-accent/40"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-semibold">{p.title}</div>
                <p className="mt-1 text-sm text-muted line-clamp-2">{p.description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Chip>{p.category}</Chip>
                  {p.bidsHidden && <Chip>Ставки скрыты</Chip>}
                </div>
              </div>
              <div className="text-accent">
                {p.budgetMin}–{p.budgetMax} USDT
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Panel>
  );
}

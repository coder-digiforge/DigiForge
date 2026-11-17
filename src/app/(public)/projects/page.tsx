import Link from "next/link";
import { Chip, Panel } from "@/components/ui";
import { getDb, listProjects } from "@/lib/store";

export default async function ProjectsPage() {
  const projects = await listProjects();
  const db = await getDb();

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-12 md:px-12">
      <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold">Проекты</h1>
      <p className="mt-2 text-muted">Открытые заказы с бюджетом в USDT</p>
      <div className="mt-8 grid gap-4">
        {projects.map((p) => {
          const client = db.users.find((u) => u.id === p.clientId);
          return (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Panel className="p-6 transition hover:border-accent/40">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
                      {p.title}
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm text-muted">{p.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Chip>{p.category}</Chip>
                      <Chip>{p.status}</Chip>
                      {p.bidsHidden && <Chip>Ставки скрыты</Chip>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-[family-name:var(--font-syne)] text-lg text-accent">
                      {p.budgetMin}–{p.budgetMax} USDT
                    </div>
                    <div className="text-xs text-muted">
                      {p.deadlineDays} дней · {client?.name}
                    </div>
                  </div>
                </div>
              </Panel>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

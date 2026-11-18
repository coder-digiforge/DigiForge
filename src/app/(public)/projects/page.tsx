import { ProjectsCatalog } from "@/components/ProjectsCatalog";
import { keepCabinetShell } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value) qs.set(key, value);
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  await keepCabinetShell({
    freelancer: `/freelancer/projects${suffix}`,
  });

  return (
    <ProjectsCatalog
      basePath="/projects"
      detailBasePath="/projects"
      variant="public"
      searchParams={params}
    />
  );
}

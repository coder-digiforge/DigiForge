import { ProjectsCatalog } from "@/components/ProjectsCatalog";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function FreelancerProjectsSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser(["freelancer"]);
  const params = await searchParams;

  return (
    <ProjectsCatalog
      basePath="/freelancer/projects"
      variant="cabinet"
      searchParams={params}
      viewerSkills={user.skills ?? []}
      viewerId={user.id}
    />
  );
}

import { ProjectsCatalog } from "@/components/ProjectsCatalog";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function FreelancerProjectsSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser(["freelancer"]);
  const params = await searchParams;
  const db = await getDb();
  const viewerBidProjectIds = [
    ...new Set(db.bids.filter((b) => b.freelancerId === user.id).map((b) => b.projectId)),
  ];

  return (
    <ProjectsCatalog
      basePath="/freelancer/projects"
      detailBasePath="/freelancer/projects"
      variant="cabinet"
      searchParams={params}
      viewerSkills={user.skills ?? []}
      viewerBidProjectIds={viewerBidProjectIds}
    />
  );
}

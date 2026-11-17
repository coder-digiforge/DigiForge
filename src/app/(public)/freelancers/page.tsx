import { FreelancersCatalog } from "@/components/FreelancersCatalog";
import { keepCabinetShell } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function FreelancersPage({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string }>;
}) {
  const { skill: skillRaw } = await searchParams;
  const skill = skillRaw?.trim() || null;
  const qs = skill ? `?skill=${encodeURIComponent(skill)}` : "";
  await keepCabinetShell({
    client: `/client/freelancers${qs}`,
  });

  return (
    <FreelancersCatalog
      basePath="/freelancers"
      skillFilter={skill}
      variant="public"
    />
  );
}

import { FreelancersCatalog } from "@/components/FreelancersCatalog";

export default async function ClientFreelancersPage({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string }>;
}) {
  const { skill: skillRaw } = await searchParams;
  return (
    <FreelancersCatalog
      basePath="/client/freelancers"
      skillFilter={skillRaw?.trim() || null}
      variant="cabinet"
    />
  );
}

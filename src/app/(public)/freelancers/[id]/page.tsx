import { notFound } from "next/navigation";
import { FreelancerPublicView } from "@/components/FreelancerPublicView";
import { keepCabinetShell } from "@/lib/auth";
import { findUserById, listPortfolio, listReviewsForUser } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function FreelancerPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await keepCabinetShell({
    client: `/client/freelancers/${id}`,
  });

  const user = await findUserById(id);
  if (!user || user.role !== "freelancer") notFound();
  const portfolio = await listPortfolio(id);
  const reviews = await listReviewsForUser(id);

  return (
    <FreelancerPublicView
      user={user}
      portfolio={portfolio}
      reviews={reviews}
      basePath="/freelancers"
      variant="public"
    />
  );
}

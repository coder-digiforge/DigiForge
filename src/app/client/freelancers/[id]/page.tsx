import { notFound } from "next/navigation";
import { FreelancerPublicView } from "@/components/FreelancerPublicView";
import { findUserById, listPortfolio, listReviewsForUser } from "@/lib/store";

export default async function ClientFreelancerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await findUserById(id);
  if (!user || user.role !== "freelancer") notFound();
  const portfolio = await listPortfolio(id);
  const reviews = await listReviewsForUser(id);

  return (
    <FreelancerPublicView
      user={user}
      portfolio={portfolio}
      reviews={reviews}
      basePath="/client/freelancers"
      variant="cabinet"
    />
  );
}

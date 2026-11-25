import { FreelancerProfilePanel } from "@/components/FreelancerProfilePanel";
import { requireUser } from "@/lib/auth";
import { getProfileCompletion } from "@/lib/profileCompletion";
import { listPortfolio } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function FreelancerPublicProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireUser(["freelancer"]);
  const { saved, error } = await searchParams;
  const portfolio = await listPortfolio(user.id);
  const completion = getProfileCompletion({
    email: user.email,
    avatarUrl: user.avatarUrl,
    title: user.title,
    bio: user.bio,
    skills: user.skills,
    walletAddress: user.walletAddress,
    portfolioCount: portfolio.length,
  });

  return (
    <FreelancerProfilePanel
      user={user}
      completionPercent={completion.percent}
      saved={Boolean(saved)}
      error={error}
      publicHref={`/freelancers/${user.id}`}
    />
  );
}

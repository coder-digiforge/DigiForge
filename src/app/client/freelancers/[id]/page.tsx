import { notFound } from "next/navigation";
import { FavoriteButton } from "@/components/FavoriteButton";
import { FreelancerPublicView } from "@/components/FreelancerPublicView";
import { InviteFreelancerForm } from "@/components/InviteFreelancerForm";
import { requireUser } from "@/lib/auth";
import { buildPortfolioAuthor } from "@/lib/portfolio-author";
import {
  findUserById,
  isFavorite,
  listBidsForFreelancer,
  listDealsForUser,
  listPortfolio,
  listProjects,
  listReviewsForUser,
} from "@/lib/store";

export default async function ClientFreelancerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; invited?: string }>;
}) {
  const client = await requireUser(["client"]);
  const { id } = await params;
  const { error, invited } = await searchParams;
  const user = await findUserById(id);
  if (!user || user.role !== "freelancer") notFound();
  const portfolio = await listPortfolio(id);
  const reviews = await listReviewsForUser(id);
  const deals = await listDealsForUser(id);
  const bids = await listBidsForFreelancer(id);
  const author = buildPortfolioAuthor({
    user,
    deals,
    bids,
    portfolioCount: portfolio.length,
  });
  const openProjects = (await listProjects("open")).filter((p) => p.clientId === client.id);
  const favorited = await isFavorite(client.id, "freelancer", id);

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-danger">{error}</p>}
      {invited && (
        <p className="rounded-xl border border-success/35 bg-[color-mix(in_srgb,var(--success)_12%,transparent)] px-4 py-3 text-sm text-success">
          Приглашение отправлено — фрилансер получит уведомление и сообщение
        </p>
      )}
      <FreelancerPublicView
        user={user}
        portfolio={portfolio}
        reviews={reviews}
        author={author}
        basePath="/client/freelancers"
        variant="cabinet"
        sidebarExtra={
          <div className="space-y-4">
            <FavoriteButton
              targetType="freelancer"
              targetId={id}
              favorited={favorited}
              returnTo={`/client/freelancers/${id}`}
            />
            <div>
              <h3 className="mb-2 text-sm font-semibold text-text">Пригласить на проект</h3>
              <InviteFreelancerForm freelancerId={id} projects={openProjects} />
            </div>
          </div>
        }
      />
    </div>
  );
}

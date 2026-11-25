import { PortfolioPanel } from "@/components/PortfolioPanel";
import { requireUser } from "@/lib/auth";
import { buildPortfolioAuthor } from "@/lib/portfolio-author";
import {
  listBidsForFreelancer,
  listDealsForUser,
  listPortfolio,
} from "@/lib/store";

export const dynamic = "force-dynamic";

const COVER_FALLBACKS = [
  "/landing/hero-viz.png",
  "/landing/ico-web.png",
  "/landing/ico-design.png",
  "/landing/step-choose.png",
];

function coverFor(id: string, coverUrl?: string) {
  if (coverUrl) return coverUrl;
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return COVER_FALLBACKS[n % COVER_FALLBACKS.length];
}

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser(["freelancer"]);
  const { error } = await searchParams;
  const items = await listPortfolio(user.id);
  const deals = await listDealsForUser(user.id);
  const bids = await listBidsForFreelancer(user.id);
  const author = buildPortfolioAuthor({
    user,
    deals,
    bids,
    portfolioCount: items.length,
    profileHref: "/freelancer/public",
    profileCta: "Обновить профиль",
  });

  return (
    <PortfolioPanel
      error={error}
      author={author}
      items={items.map((c) => ({
        id: c.id,
        title: c.title,
        summary: c.summary,
        tags: c.tags,
        priceUsdt: c.priceUsdt,
        projectUrl: c.projectUrl,
        cover: coverFor(c.id, c.coverUrl),
        createdAt: c.createdAt,
      }))}
    />
  );
}

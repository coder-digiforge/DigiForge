import { PortfolioPanel } from "@/components/PortfolioPanel";
import { requireUser } from "@/lib/auth";
import { listPortfolio } from "@/lib/store";

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

  return (
    <PortfolioPanel
      error={error}
      publicHref="/freelancer/public?tab=portfolio"
      items={items.map((c) => ({
        id: c.id,
        title: c.title,
        summary: c.summary,
        tags: c.tags,
        priceUsdt: c.priceUsdt,
        projectUrl: c.projectUrl,
        cover: coverFor(c.id, c.coverUrl),
      }))}
    />
  );
}

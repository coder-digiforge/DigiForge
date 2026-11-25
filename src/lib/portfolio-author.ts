import type { Bid, Deal, User } from "@/lib/types";

export type PortfolioAuthor = {
  name: string;
  avatarUrl?: string;
  title?: string;
  location?: string;
  rating: number;
  reviewCount: number;
  projectCount: number;
  available: boolean;
  memberSince: string;
  profileHref?: string;
  profileCta?: string;
  indicators: { label: string; value: string }[];
};

function formatAgo(iso: string | undefined, empty = "—") {
  if (!iso) return empty;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return empty;
  const days = Math.floor(ms / 86_400_000);
  if (days < 1) return "сегодня";
  if (days < 7) return `${days} дн. назад`;
  const months = Math.floor(days / 30);
  if (months < 1) return `${Math.floor(days / 7)} нед. назад`;
  if (months < 12) return `${months} мес. назад`;
  const years = Math.floor(months / 12);
  return years === 1 ? "1 год на сервисе" : `${years} лет на сервисе`;
}

function formatTenure(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "недавно";
  const days = Math.floor(ms / 86_400_000);
  if (days < 30) return "меньше месяца";
  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? "1 месяц" : `${months} мес.`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (years === 1 && rest === 0) return "1 год";
  if (rest === 0) return `${years} лет`;
  return `${years} г. ${rest} мес.`;
}

export function buildPortfolioAuthor({
  user,
  deals,
  bids,
  portfolioCount,
  profileHref,
  profileCta,
}: {
  user: Omit<User, "password">;
  deals: Deal[];
  bids: Bid[];
  portfolioCount: number;
  profileHref?: string;
  profileCta?: string;
}): PortfolioAuthor {
  const mine = deals.filter((d) => d.freelancerId === user.id);
  const completed = mine.filter((d) => d.status === "released");
  const dealStamp = (d: Deal) =>
    d.releasedAt ?? d.deliveredAt ?? d.fundedAt ?? d.createdAt;
  const lastDeal = [...mine].sort(
    (a, b) => new Date(dealStamp(b)).getTime() - new Date(dealStamp(a)).getTime(),
  )[0];
  const twoWeeksAgo = Date.now() - 14 * 86_400_000;
  const recentBids = bids.filter(
    (b) => b.freelancerId === user.id && new Date(b.createdAt).getTime() >= twoWeeksAgo,
  ).length;
  const clients = new Set(mine.map((d) => d.clientId)).size;
  const location =
    user.loginLog?.find((s) => s.current)?.location ||
    user.loginLog?.[0]?.location ||
    undefined;

  return {
    name: user.name,
    avatarUrl: user.avatarUrl,
    title: user.title,
    location,
    rating: user.rating,
    reviewCount: user.reviewCount,
    projectCount: completed.length || portfolioCount,
    available: !user.deactivatedAt,
    memberSince: user.createdAt,
    profileHref,
    profileCta,
    indicators: [
      {
        label: "Последний проект",
        value: formatAgo(lastDeal ? dealStamp(lastDeal) : undefined, "пока нет"),
      },
      { label: "Ставки за 2 недели", value: String(recentBids) },
      { label: "Клиентов", value: String(clients) },
      { label: "На сервисе", value: formatTenure(user.createdAt) },
    ],
  };
}

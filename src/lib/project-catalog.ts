import type { Project } from "./types";

export const PROJECT_CATEGORIES = [
  "Сайты и лендинги",
  "Мобильные приложения",
  "UI/UX дизайн",
  "AI и автоматизация",
  "Маркетинг и рост",
  "Стратегия продукта",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export type ProjectSort =
  | "newest"
  | "budget_desc"
  | "budget_asc"
  | "deadline_asc"
  | "bids_asc"
  | "match";

export type DeadlineFilter = "any" | "week" | "two_weeks" | "month";
export type BidsVisibilityFilter = "any" | "open" | "hidden";
export type BudgetPreset = "any" | "lt1k" | "1to2k" | "gte2k";

export type ProjectCatalogQuery = {
  q?: string;
  category?: string;
  sort?: ProjectSort;
  deadline?: DeadlineFilter;
  bids?: BidsVisibilityFilter;
  budget?: BudgetPreset;
  budgetMin?: number;
  budgetMax?: number;
  /** Только проекты без моей ставки */
  free?: boolean;
};

const CATEGORY_SKILLS: Record<string, string[]> = {
  "Сайты и лендинги": ["react", "next", "next.js", "typescript", "html", "css", "web", "frontend"],
  "Мобильные приложения": ["react native", "flutter", "swift", "kotlin", "mobile", "ios", "android"],
  "UI/UX дизайн": ["figma", "ui", "ux", "design", "design systems"],
  "AI и автоматизация": ["python", "ai", "ml", "nlp", "node", "automation", "bot", "telegram"],
  "Маркетинг и рост": ["marketing", "seo", "ads", "growth", "content"],
  "Стратегия продукта": ["product", "strategy", "analytics", "research"],
};

export function parseProjectCatalogQuery(
  raw: Record<string, string | string[] | undefined>,
): ProjectCatalogQuery {
  const pick = (key: string) => {
    const v = raw[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const sortRaw = pick("sort") as ProjectSort | undefined;
  const sort: ProjectSort =
    sortRaw &&
    ["newest", "budget_desc", "budget_asc", "deadline_asc", "bids_asc", "match"].includes(sortRaw)
      ? sortRaw
      : "newest";

  const deadlineRaw = pick("deadline") as DeadlineFilter | undefined;
  const deadline: DeadlineFilter =
    deadlineRaw && ["any", "week", "two_weeks", "month"].includes(deadlineRaw)
      ? deadlineRaw
      : "any";

  const bidsRaw = pick("bids") as BidsVisibilityFilter | undefined;
  const bids: BidsVisibilityFilter =
    bidsRaw && ["any", "open", "hidden"].includes(bidsRaw) ? bidsRaw : "any";

  const budgetRaw = pick("budget") as BudgetPreset | undefined;
  const budget: BudgetPreset =
    budgetRaw && ["any", "lt1k", "1to2k", "gte2k"].includes(budgetRaw) ? budgetRaw : "any";

  const budgetMin = Number(pick("budgetMin") ?? "");
  const budgetMax = Number(pick("budgetMax") ?? "");

  return {
    q: (pick("q") ?? "").trim() || undefined,
    category: (pick("category") ?? "").trim() || undefined,
    sort,
    deadline,
    bids,
    budget,
    budgetMin: Number.isFinite(budgetMin) && budgetMin > 0 ? budgetMin : undefined,
    budgetMax: Number.isFinite(budgetMax) && budgetMax > 0 ? budgetMax : undefined,
    free: pick("free") === "1" || pick("free") === "on",
  };
}

export function matchScore(project: Project, skills: string[]) {
  if (!skills.length) return 0;
  const needle = skills.map((s) => s.toLowerCase());
  const hay = [
    project.category.toLowerCase(),
    project.title.toLowerCase(),
    project.description.toLowerCase(),
    ...(CATEGORY_SKILLS[project.category] ?? []),
  ].join(" ");
  let score = 0;
  for (const s of needle) {
    if (s.length >= 2 && hay.includes(s)) score += 2;
  }
  if ((CATEGORY_SKILLS[project.category] ?? []).some((k) => needle.some((s) => k.includes(s) || s.includes(k)))) {
    score += 3;
  }
  return score;
}

export function filterAndSortProjects<
  T extends {
    project: Project;
    bidCount: number;
    myBid?: boolean;
  },
>(
  rows: T[],
  query: ProjectCatalogQuery,
  skills: string[] = [],
): T[] {
  let out = rows.filter(({ project, myBid }) => {
    if (project.status !== "open") return false;

    if (query.category && project.category !== query.category) return false;

    if (query.q) {
      const q = query.q.toLowerCase();
      const blob = `${project.title} ${project.description} ${project.category}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }

    if (query.bids === "open" && project.bidsHidden) return false;
    if (query.bids === "hidden" && !project.bidsHidden) return false;

    if (query.free && myBid) return false;

    if (query.deadline === "week" && project.deadlineDays > 7) return false;
    if (query.deadline === "two_weeks" && project.deadlineDays > 14) return false;
    if (query.deadline === "month" && project.deadlineDays > 30) return false;

    const mid = (project.budgetMin + project.budgetMax) / 2;
    if (query.budget === "lt1k" && mid >= 1000) return false;
    if (query.budget === "1to2k" && (mid < 1000 || mid > 2000)) return false;
    if (query.budget === "gte2k" && mid < 2000) return false;

    if (query.budgetMin != null && project.budgetMax < query.budgetMin) return false;
    if (query.budgetMax != null && project.budgetMin > query.budgetMax) return false;

    return true;
  });

  const sort = query.sort ?? "newest";
  out = [...out].sort((a, b) => {
    if (sort === "budget_desc") {
      return b.project.budgetMax - a.project.budgetMax || b.project.budgetMin - a.project.budgetMin;
    }
    if (sort === "budget_asc") {
      return a.project.budgetMin - b.project.budgetMin || a.project.budgetMax - b.project.budgetMax;
    }
    if (sort === "deadline_asc") {
      return a.project.deadlineDays - b.project.deadlineDays;
    }
    if (sort === "bids_asc") {
      if (a.project.bidsHidden !== b.project.bidsHidden) return a.project.bidsHidden ? 1 : -1;
      return a.bidCount - b.bidCount;
    }
    if (sort === "match") {
      const sa = matchScore(a.project, skills);
      const sb = matchScore(b.project, skills);
      if (sa !== sb) return sb - sa;
      return b.project.createdAt.localeCompare(a.project.createdAt);
    }
    return b.project.createdAt.localeCompare(a.project.createdAt);
  });

  return out;
}

export function buildProjectCatalogHref(
  basePath: string,
  query: ProjectCatalogQuery,
  patch: Partial<ProjectCatalogQuery> = {},
) {
  const next: ProjectCatalogQuery = { ...query, ...patch };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.category) params.set("category", next.category);
  if (next.sort && next.sort !== "newest") params.set("sort", next.sort);
  if (next.deadline && next.deadline !== "any") params.set("deadline", next.deadline);
  if (next.bids && next.bids !== "any") params.set("bids", next.bids);
  if (next.budget && next.budget !== "any") params.set("budget", next.budget);
  if (next.budgetMin) params.set("budgetMin", String(next.budgetMin));
  if (next.budgetMax) params.set("budgetMax", String(next.budgetMax));
  if (next.free) params.set("free", "1");
  const s = params.toString();
  return s ? `${basePath}?${s}` : basePath;
}

export function formatPostedAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "только что";
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "вчера";
  if (days < 7) return `${days} дн. назад`;
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

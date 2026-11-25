import type { Project } from "./types";

type LegacyBudgetFields = {
  budgetMin?: number;
  budgetMax?: number;
};

/** Fixed client budget, or null when not specified (Freelancehunt-style). */
export function normalizeProjectBudget(
  project: Partial<Project> & LegacyBudgetFields,
): number | null {
  if ("budget" in project) {
    const b = project.budget;
    if (b == null) return null;
    const n = Number(b);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  const min = Number(project.budgetMin);
  const max = Number(project.budgetMax);
  if (Number.isFinite(min) && min > 0 && Number.isFinite(max) && max > 0) {
    return Math.round((min + max) / 2);
  }
  if (Number.isFinite(max) && max > 0) return max;
  if (Number.isFinite(min) && min > 0) return min;
  return null;
}

export function formatProjectBudget(
  project: Pick<Project, "budget"> | number | null | undefined,
  opts?: { withCurrency?: boolean },
): string {
  const withCurrency = opts?.withCurrency !== false;
  const value =
    typeof project === "number" || project == null
      ? project
      : project.budget;
  if (value == null || !(value > 0)) {
    return "Не указан";
  }
  const formatted = value.toLocaleString("ru-RU");
  return withCurrency ? `${formatted} USDT` : formatted;
}

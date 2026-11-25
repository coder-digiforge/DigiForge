import type { DbShape, Deal, Project } from "@/lib/types";
import { DEFAULT_FEE_PERCENT } from "./constants";
import { normalizeProjectBudget } from "../project-budget";

/** Normalize older JSON payloads so finance code can assume required fields. */
export function ensureFinanceShape(db: DbShape): DbShape {
  if (!db.meta) {
    db.meta = { version: 0, financePolicyVersion: 1 };
  }
  if (typeof db.meta.version !== "number") db.meta.version = 0;
  if (typeof db.meta.financePolicyVersion !== "number") {
    db.meta.financePolicyVersion = 1;
  }
  if (!Array.isArray(db.auditLog)) db.auditLog = [];
  if (!Array.isArray(db.webhookEvents)) db.webhookEvents = [];
  if (!Array.isArray(db.deposits)) db.deposits = [];
  if (!Array.isArray(db.withdrawals)) db.withdrawals = [];
  if (!Array.isArray(db.ledger)) db.ledger = [];
  if (!Array.isArray(db.deals)) db.deals = [];
  if (!Array.isArray(db.projects)) db.projects = [];
  if (!Array.isArray(db.favorites)) db.favorites = [];

  for (const project of db.projects as Array<
    Project & { budgetMin?: number; budgetMax?: number }
  >) {
    const budget = normalizeProjectBudget(project);
    project.budget = budget;
    delete project.budgetMin;
    delete project.budgetMax;
    if (!Array.isArray(project.skills)) project.skills = project.skills ?? [];
    if (!Array.isArray(project.attachments)) project.attachments = project.attachments ?? [];
  }

  for (const deal of db.deals as Deal[]) {
    if (typeof deal.feePercent !== "number") deal.feePercent = DEFAULT_FEE_PERCENT;
    if (typeof deal.feeAmount !== "number") {
      deal.feeAmount = Number(((deal.amount * deal.feePercent) / 100).toFixed(2));
    }
  }

  for (const dep of db.deposits) {
    if (!dep.expiresAt) {
      dep.expiresAt = new Date(
        new Date(dep.createdAt).getTime() + 2 * 60 * 60 * 1000,
      ).toISOString();
    }
  }

  return db;
}

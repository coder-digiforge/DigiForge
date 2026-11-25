import type { DbShape, Deal, Project } from "@/lib/types";
import { DEFAULT_FEE_PERCENT } from "./constants";
import { normalizeProjectBudget } from "../project-budget";

function isPublishedDealReview(db: DbShape, dealId: string) {
  const forDeal = db.reviews.filter((r) => r.dealId === dealId);
  if (forDeal.length < 2) return false;
  const deal = db.deals.find((d) => d.id === dealId);
  if (deal) {
    return (
      forDeal.some((r) => r.fromUserId === deal.clientId) &&
      forDeal.some((r) => r.fromUserId === deal.freelancerId)
    );
  }
  return new Set(forDeal.map((r) => r.fromUserId)).size >= 2;
}

function applyPublishedReviewStats(db: DbShape) {
  const publishedByDeal = new Set<string>();
  for (const review of db.reviews) {
    if (isPublishedDealReview(db, review.dealId)) {
      publishedByDeal.add(review.dealId);
    }
  }

  for (const user of db.users) {
    if (user.role === "admin") continue;
    // Keep demo/catalog fluff ratings for users with no review rows yet.
    if (!db.reviews.some((r) => r.toUserId === user.id)) continue;
    const reviews = db.reviews.filter(
      (r) => r.toUserId === user.id && publishedByDeal.has(r.dealId),
    );
    user.reviewCount = reviews.length;
    user.rating =
      reviews.length === 0
        ? 0
        : Number(
            (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1),
          );
  }
}

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
  if (!Array.isArray(db.projectComments)) db.projectComments = [];

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

  if (!Array.isArray(db.threads)) db.threads = [];
  if (!Array.isArray(db.messages)) db.messages = [];
  if (!Array.isArray(db.notifications)) db.notifications = [];

  for (const thread of db.threads) {
    if (!thread.lastReadAt || typeof thread.lastReadAt !== "object") {
      thread.lastReadAt = {};
    }
  }

  // Chat belongs in Messages UI — drop legacy "new message" bell spam.
  db.notifications = db.notifications.filter((n) => n.title !== "Новое сообщение");

  // Ratings only count mutually exchanged reviews.
  if (Array.isArray(db.reviews) && Array.isArray(db.users)) {
    applyPublishedReviewStats(db);
  }

  return db;
}

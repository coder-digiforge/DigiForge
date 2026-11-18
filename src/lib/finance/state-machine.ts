import type { EscrowStatus } from "@/lib/types";

/** Allowed deal status transitions. Anything else is rejected. */
const TRANSITIONS: Record<EscrowStatus, readonly EscrowStatus[]> = {
  pending_funding: ["funded", "in_progress"], // fund may jump to in_progress
  funded: ["in_progress", "disputed", "refunded"],
  in_progress: ["delivered", "disputed", "released", "refunded"],
  delivered: ["released", "disputed", "refunded"],
  disputed: ["released", "refunded"],
  released: [],
  refunded: [],
};

export function canTransitionDeal(from: EscrowStatus, to: EscrowStatus): boolean {
  if (from === to) return true;
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertDealTransition(from: EscrowStatus, to: EscrowStatus) {
  if (!canTransitionDeal(from, to)) {
    throw new Error(`Недопустимый переход сделки: ${from} → ${to}`);
  }
}

export function isTerminalDeal(status: EscrowStatus) {
  return status === "released" || status === "refunded";
}

export function canClientRelease(status: EscrowStatus) {
  return status === "delivered";
}

export function canDispute(status: EscrowStatus) {
  return status === "funded" || status === "in_progress" || status === "delivered";
}

export function canFund(status: EscrowStatus) {
  return status === "pending_funding";
}

import type {
  EscrowStatus,
  LedgerKind,
  ProjectStatus,
  Role,
} from "./types";

export const roleLabel: Record<Role, string> = {
  admin: "Админ",
  client: "Заказчик",
  freelancer: "Фрилансер",
};

export const projectStatusLabel: Record<ProjectStatus, string> = {
  open: "Открыт",
  in_progress: "В работе",
  delivered: "Сдан",
  completed: "Завершён",
  disputed: "Диспут",
  cancelled: "Отменён",
};

export const dealStatusLabel: Record<EscrowStatus, string> = {
  pending_funding: "Ожидает оплату",
  funded: "В сейфе",
  in_progress: "В работе",
  delivered: "На приёмке",
  released: "Выплачен",
  disputed: "Диспут",
  refunded: "Возврат",
};

export const ledgerKindLabel: Record<LedgerKind, string> = {
  deposit: "Депозит",
  withdraw: "Вывод",
  withdraw_hold: "Холд вывода",
  withdraw_release: "Снятие холда",
  escrow_lock: "Лок эскроу",
  escrow_release: "Релиз эскроу",
  escrow_refund: "Возврат эскроу",
  fee: "Комиссия",
  prime: "Digi Prime",
};

export const depositStatusLabel: Record<
  "awaiting" | "confirming" | "completed" | "expired",
  string
> = {
  awaiting: "Ожидает",
  confirming: "Подтверждение",
  completed: "Завершён",
  expired: "Истёк",
};

export const withdrawalStatusLabel: Record<
  "pending" | "processing" | "completed" | "rejected",
  string
> = {
  pending: "Ожидает",
  processing: "В обработке",
  completed: "Выполнен",
  rejected: "Отклонён",
};

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.floor(diff / 60000));
  if (mins < 60) return `${mins} мин. назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч. назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн. назад`;
}

export function formatUsdt(amount: number) {
  return `${amount.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} USDT`;
}

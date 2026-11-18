import type { CryptoNetwork } from "@/lib/types";
import {
  MAX_DEPOSIT_USDT,
  MAX_WITHDRAW_USDT,
  MIN_DEPOSIT_USDT,
  MIN_WITHDRAW_USDT,
} from "./constants";

const TRC20_RE = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
const ERC20_RE = /^0x[a-fA-F0-9]{40}$/;

export function assertPositiveMoney(amount: number, label = "Сумма") {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`${label}: некорректное значение`);
  }
  const rounded = Number(amount.toFixed(2));
  if (Math.abs(rounded - amount) > 1e-9) {
    throw new Error(`${label}: максимум 2 знака после запятой`);
  }
}

export function normalizeUsdt(amount: number) {
  return Number(amount.toFixed(2));
}

export function assertDepositAmount(amount: number) {
  assertPositiveMoney(amount, "Сумма депозита");
  const n = normalizeUsdt(amount);
  if (n < MIN_DEPOSIT_USDT) throw new Error(`Минимальный депозит ${MIN_DEPOSIT_USDT} USDT`);
  if (n > MAX_DEPOSIT_USDT) throw new Error(`Максимальный депозит ${MAX_DEPOSIT_USDT} USDT`);
  return n;
}

export function assertWithdrawAmount(amount: number) {
  assertPositiveMoney(amount, "Сумма вывода");
  const n = normalizeUsdt(amount);
  if (n < MIN_WITHDRAW_USDT) throw new Error(`Минимальный вывод ${MIN_WITHDRAW_USDT} USDT`);
  if (n > MAX_WITHDRAW_USDT) throw new Error(`Максимальный вывод ${MAX_WITHDRAW_USDT} USDT`);
  return n;
}

export function assertWalletAddress(address: string, network: CryptoNetwork) {
  const trimmed = address.trim();
  if (!trimmed) throw new Error("Укажите адрес кошелька");
  if (network === "TRC20" && !TRC20_RE.test(trimmed)) {
    throw new Error("Некорректный TRC20-адрес (ожидается T…)");
  }
  if (network === "ERC20" && !ERC20_RE.test(trimmed)) {
    throw new Error("Некорректный ERC20-адрес (ожидается 0x…)");
  }
  return trimmed;
}

export function assertCryptoNetwork(value: string): CryptoNetwork {
  if (value === "TRC20" || value === "ERC20") return value;
  throw new Error("Неподдерживаемая сеть");
}

/** Prevent double-credit: tx hashes must be unique when present. */
export function assertUniqueTxHash(
  existing: Array<{ txHash?: string }>,
  txHash: string | undefined,
) {
  if (!txHash) return;
  const hit = existing.some((e) => e.txHash && e.txHash === txHash);
  if (hit) throw new Error("Транзакция уже учтена (идемпотентность)");
}

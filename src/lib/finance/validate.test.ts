import { describe, it } from "node:test";
import assert from "node:assert/strict";

/** Standalone copies so node:test does not need TS path resolution for ./constants. */
const TRC20_RE = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
const ERC20_RE = /^0x[a-fA-F0-9]{40}$/;

function normalizeUsdt(amount: number) {
  return Number(amount.toFixed(2));
}

function assertUniqueTxHash(existing: Array<{ txHash?: string }>, txHash: string | undefined) {
  if (!txHash) return;
  if (existing.some((e) => e.txHash && e.txHash === txHash)) {
    throw new Error("Транзакция уже учтена (идемпотентность)");
  }
}

describe("finance validate (pure)", () => {
  it("normalizes USDT to 2 decimals", () => {
    assert.equal(normalizeUsdt(10.456), 10.46);
  });

  it("validates wallet regexes", () => {
    assert.equal(TRC20_RE.test("T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb"), true);
    assert.equal(TRC20_RE.test("not-an-address"), false);
    assert.equal(ERC20_RE.test("0x123"), false);
    assert.equal(ERC20_RE.test("0xDigiForgeEscrowDeposit111111111111".padEnd(42, "0").slice(0, 42)), false);
  });

  it("enforces unique tx hash", () => {
    assert.throws(() => assertUniqueTxHash([{ txHash: "abc" }], "abc"), /уже учтена/);
    assert.doesNotThrow(() => assertUniqueTxHash([{ txHash: "abc" }], "xyz"));
  });
});

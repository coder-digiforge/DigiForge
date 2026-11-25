import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canClientRelease,
  canDispute,
  canFund,
  canTransitionDeal,
  isTerminalDeal,
} from "./state-machine.ts";

describe("escrow state machine", () => {
  it("allows fund from pending_funding", () => {
    assert.equal(canFund("pending_funding"), true);
    assert.equal(canTransitionDeal("pending_funding", "funded"), true);
  });

  it("allows dispute only from active statuses", () => {
    assert.equal(canDispute("funded"), true);
    assert.equal(canDispute("in_progress"), true);
    assert.equal(canDispute("delivered"), true);
    assert.equal(canDispute("released"), false);
  });

  it("client release only from delivered", () => {
    assert.equal(canClientRelease("delivered"), true);
    assert.equal(canClientRelease("in_progress"), false);
  });

  it("terminal statuses have no exits", () => {
    assert.equal(isTerminalDeal("released"), true);
    assert.equal(isTerminalDeal("refunded"), true);
    assert.equal(canTransitionDeal("released", "disputed"), false);
  });
});

const { test, describe } = require("node:test");
const assert = require("node:assert");
const {
  STATUS,
  STATUS_CODES,
  canTransition,
  isTerminal,
  assertTransition,
  ALLOWED_TRANSITIONS,
} = require("../src/utils/requestStatus");

describe("canTransition", () => {
  test("a pending request can be verified", () => {
    assert.ok(canTransition(STATUS.PENDING_VERIFICATION, STATUS.VERIFIED));
  });

  test("a pending request can be rejected", () => {
    assert.ok(canTransition(STATUS.PENDING_VERIFICATION, STATUS.REJECTED));
  });

  test("a verified request cannot go back to pending", () => {
    assert.ok(!canTransition(STATUS.VERIFIED, STATUS.PENDING_VERIFICATION));
  });

  test("a cancelled request cannot be revived", () => {
    assert.ok(!canTransition(STATUS.CANCELLED, STATUS.VERIFIED));
  });

  test("a fulfilled request cannot be cancelled", () => {
    assert.ok(!canTransition(STATUS.FULFILLED, STATUS.CANCELLED));
  });

  test("a request cannot transition to itself", () => {
    assert.ok(!canTransition(STATUS.VERIFIED, STATUS.VERIFIED));
  });

  test("matching can only be reached from verified", () => {
    const sources = STATUS_CODES.filter((s) => canTransition(s, STATUS.MATCHING));
    assert.deepStrictEqual(sources, [STATUS.VERIFIED]);
  });
});

describe("isTerminal", () => {
  test("fulfilled is terminal", () => {
    assert.ok(isTerminal(STATUS.FULFILLED));
  });

  test("cancelled, rejected and expired are terminal", () => {
    assert.ok(isTerminal(STATUS.CANCELLED));
    assert.ok(isTerminal(STATUS.REJECTED));
    assert.ok(isTerminal(STATUS.EXPIRED));
  });

  test("pending verification is not terminal", () => {
    assert.ok(!isTerminal(STATUS.PENDING_VERIFICATION));
  });

  test("terminal statuses have no outgoing transitions", () => {
    for (const code of STATUS_CODES) {
      if (isTerminal(code)) {
        assert.strictEqual(
          ALLOWED_TRANSITIONS[code].length,
          0,
          `${code} is terminal but has outgoing transitions`
        );
      }
    }
  });
});

describe("assertTransition", () => {
  test("passes silently for a legal move", () => {
    assert.doesNotThrow(() =>
      assertTransition(STATUS.PENDING_VERIFICATION, STATUS.VERIFIED)
    );
  });

  test("throws a 409 for an illegal move", () => {
    try {
      assertTransition(STATUS.VERIFIED, STATUS.PENDING_VERIFICATION);
      assert.fail("should have thrown");
    } catch (err) {
      assert.strictEqual(err.status, 409);
    }
  });

  test("explains that a terminal request cannot change", () => {
    try {
      assertTransition(STATUS.CANCELLED, STATUS.VERIFIED);
      assert.fail("should have thrown");
    } catch (err) {
      assert.match(err.message, /already CANCELLED/);
    }
  });
});

describe("transition table integrity", () => {
  test("every status has an entry", () => {
    for (const code of STATUS_CODES) {
      assert.ok(Array.isArray(ALLOWED_TRANSITIONS[code]), `${code} has no entry`);
    }
  });

  test("no transition points at an unknown status", () => {
    for (const [from, targets] of Object.entries(ALLOWED_TRANSITIONS)) {
      for (const to of targets) {
        assert.ok(STATUS_CODES.includes(to), `${from} -> ${to} is not a valid status`);
      }
    }
  });
});
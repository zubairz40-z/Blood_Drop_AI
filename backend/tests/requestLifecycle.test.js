const { test, describe } = require("node:test");
const assert = require("node:assert");
const {
  STATUS,
  STATUS_CODES,
  canTransition,
  isTerminal,
  ALLOWED_TRANSITIONS,
} = require("../src/utils/requestStatus");

describe("lifecycle reachability", () => {
  test("every status is reachable from the starting state", () => {
    const start = STATUS.PENDING_VERIFICATION;
    const seen = new Set([start]);
    const queue = [start];

    while (queue.length) {
      const current = queue.shift();
      for (const next of ALLOWED_TRANSITIONS[current]) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }

    for (const code of STATUS_CODES) {
      assert.ok(seen.has(code), `${code} is unreachable from ${start}`);
    }
  });

  test("every non-terminal status can reach a terminal one", () => {
    for (const code of STATUS_CODES) {
      if (isTerminal(code)) continue;

      const seen = new Set([code]);
      const queue = [code];
      let foundEnd = false;

      while (queue.length && !foundEnd) {
        const current = queue.shift();
        if (isTerminal(current)) foundEnd = true;
        for (const next of ALLOWED_TRANSITIONS[current]) {
          if (!seen.has(next)) {
            seen.add(next);
            queue.push(next);
          }
        }
      }

      assert.ok(foundEnd, `${code} has no path to a terminal state — requests could get stuck`);
    }
  });

  test("a request can always be cancelled before it is fulfilled", () => {
    const cancellable = STATUS_CODES.filter(
      (s) => !isTerminal(s) && canTransition(s, STATUS.CANCELLED)
    );
    const nonTerminal = STATUS_CODES.filter((s) => !isTerminal(s));

    assert.deepStrictEqual(
      cancellable.sort(),
      nonTerminal.sort(),
      "every in-progress status should allow cancellation"
    );
  });

  test("no status can transition to itself", () => {
    for (const code of STATUS_CODES) {
      assert.ok(!canTransition(code, code), `${code} allows a no-op transition`);
    }
  });

  test("the happy path runs end to end", () => {
    const path = [
      STATUS.PENDING_VERIFICATION,
      STATUS.VERIFIED,
      STATUS.MATCHING,
      STATUS.MATCHED,
      STATUS.FULFILLED,
    ];

    for (let i = 0; i < path.length - 1; i++) {
      assert.ok(
        canTransition(path[i], path[i + 1]),
        `${path[i]} -> ${path[i + 1]} should be allowed`
      );
    }
  });

  test("fulfilled is the only successful ending", () => {
    const endings = STATUS_CODES.filter(isTerminal);
    assert.ok(endings.includes(STATUS.FULFILLED));
    assert.strictEqual(endings.length, 4, "fulfilled, cancelled, rejected, expired");
  });
});
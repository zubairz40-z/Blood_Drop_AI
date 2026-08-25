const { test, describe } = require("node:test");
const assert = require("node:assert");
const {
  calculateNextEligibleAt,
  calculateAge,
  DEFERRAL_DAYS,
  COMPONENT_CODES,
} = require("../src/utils/donationRules");

describe("calculateNextEligibleAt", () => {
  test("adds 56 days for whole blood", () => {
    const donated = new Date("2026-01-01T10:00:00Z");
    const next = calculateNextEligibleAt("WHOLE_BLOOD", donated);
    assert.strictEqual(next.toISOString().slice(0, 10), "2026-02-26");
  });

  test("adds 28 days for plasma", () => {
    const donated = new Date("2026-01-01T10:00:00Z");
    const next = calculateNextEligibleAt("PLASMA", donated);
    assert.strictEqual(next.toISOString().slice(0, 10), "2026-01-29");
  });

  test("adds 7 days for platelets", () => {
    const donated = new Date("2026-03-10T10:00:00Z");
    const next = calculateNextEligibleAt("PLATELETS", donated);
    assert.strictEqual(next.toISOString().slice(0, 10), "2026-03-17");
  });

  test("adds 112 days for double red cells", () => {
    const donated = new Date("2026-01-01T10:00:00Z");
    const next = calculateNextEligibleAt("DOUBLE_RED_CELLS", donated);
    assert.strictEqual(next.toISOString().slice(0, 10), "2026-04-23");
  });

  test("different components produce different deferrals", () => {
    const donated = new Date("2026-01-01T10:00:00Z");
    const whole = calculateNextEligibleAt("WHOLE_BLOOD", donated);
    const plasma = calculateNextEligibleAt("PLASMA", donated);
    assert.ok(whole > plasma, "whole blood defers longer than plasma");
  });

  test("crosses a month boundary correctly", () => {
    const donated = new Date("2026-01-28T10:00:00Z");
    const next = calculateNextEligibleAt("PLATELETS", donated);
    assert.strictEqual(next.toISOString().slice(0, 10), "2026-02-04");
  });

  test("rejects an unknown component", () => {
    assert.throws(
      () => calculateNextEligibleAt("UNICORN_BLOOD", new Date()),
      /Unknown component/
    );
  });

  test("every declared component has a deferral rule", () => {
    for (const code of COMPONENT_CODES) {
      assert.ok(DEFERRAL_DAYS[code] > 0, `${code} is missing a deferral period`);
    }
  });
});

describe("calculateAge", () => {
  test("returns whole years", () => {
    const twentyYearsAgo = new Date();
    twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
    assert.strictEqual(calculateAge(twentyYearsAgo), 20);
  });

  test("does not count a birthday that has not happened yet", () => {
    const almost = new Date();
    almost.setFullYear(almost.getFullYear() - 20);
    almost.setDate(almost.getDate() + 1); // birthday is tomorrow
    assert.strictEqual(calculateAge(almost), 19);
  });

  test("counts a birthday that happened yesterday", () => {
    const justHad = new Date();
    justHad.setFullYear(justHad.getFullYear() - 20);
    justHad.setDate(justHad.getDate() - 1);
    assert.strictEqual(calculateAge(justHad), 20);
  });

  test("returns null when no date is given", () => {
    assert.strictEqual(calculateAge(null), null);
  });
});
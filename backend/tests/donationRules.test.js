const { test, describe } = require("node:test");
const assert = require("node:assert");
const {
  calculateNextEligibleAt,
  calculateAge,
  checkEligibility,
  compatibleDonorGroups,
  isCompatible,
  BLOOD_GROUPS,
  RED_CELL_COMPATIBILITY,
  PLASMA_COMPATIBILITY,
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

  // A fixed "now" so these tests never drift with the real clock
const NOW = new Date("2026-08-26T12:00:00Z");

/**
 * Builds a plain object shaped like a DonorProfile. Not a Mongoose
 * document — checkEligibility only reads fields, so a literal is enough
 * and keeps these tests free of any database dependency.
 */
function makeDonor(overrides = {}) {
  return {
    dateOfBirth: new Date("1998-01-01T00:00:00Z"), // 28 at NOW
    weightKg: 70,
    donationTypes: ["WHOLE_BLOOD", "PLASMA", "PLATELETS", "DOUBLE_RED_CELLS"],
    eligibility: [],
    ...overrides,
  };
}

describe("checkEligibility", () => {
  test("a donor who has never given this component is eligible", () => {
    const result = checkEligibility(makeDonor(), "PLATELETS", NOW);
    assert.strictEqual(result.eligible, true);
    assert.deepStrictEqual(result.reasons, []);
    assert.strictEqual(result.nextEligibleAt, null);
  });

  test("an entry for another component does not block this one", () => {
    const donor = makeDonor({
      eligibility: [
        { component: "WHOLE_BLOOD", nextEligibleAt: new Date("2026-12-01T00:00:00Z") },
      ],
    });
    assert.strictEqual(checkEligibility(donor, "PLATELETS", NOW).eligible, true);
  });

  test("a donor inside the deferral window is not eligible", () => {
    const donor = makeDonor({
      eligibility: [
        { component: "WHOLE_BLOOD", nextEligibleAt: new Date("2026-09-05T00:00:00Z") },
      ],
    });
    const result = checkEligibility(donor, "WHOLE_BLOOD", NOW);
    assert.strictEqual(result.eligible, false);
    assert.strictEqual(result.nextEligibleAt.toISOString().slice(0, 10), "2026-09-05");
  });

  test("a deferral date in the past does not block", () => {
    const donor = makeDonor({
      eligibility: [
        { component: "WHOLE_BLOOD", nextEligibleAt: new Date("2026-08-01T00:00:00Z") },
      ],
    });
    assert.strictEqual(checkEligibility(donor, "WHOLE_BLOOD", NOW).eligible, true);
  });

  test("a medical deferral blocks and reports its reason", () => {
    const donor = makeDonor({
      eligibility: [
        {
          component: "PLASMA",
          medicallyDeferredUntil: new Date("2026-10-01T00:00:00Z"),
          deferralReason: "Recent tattoo",
        },
      ],
    });
    const result = checkEligibility(donor, "PLASMA", NOW);
    assert.strictEqual(result.eligible, false);
    assert.ok(result.reasons.some((r) => r.includes("Recent tattoo")));
  });

  test("a component the donor does not offer is refused", () => {
    const donor = makeDonor({ donationTypes: ["WHOLE_BLOOD"] });
    assert.strictEqual(checkEligibility(donor, "PLATELETS", NOW).eligible, false);
  });

  test("donors below and above the age range are refused", () => {
    const tooYoung = makeDonor({ dateOfBirth: new Date("2010-01-01T00:00:00Z") });
    const tooOld = makeDonor({ dateOfBirth: new Date("1950-01-01T00:00:00Z") });
    assert.strictEqual(checkEligibility(tooYoung, "WHOLE_BLOOD", NOW).eligible, false);
    assert.strictEqual(checkEligibility(tooOld, "WHOLE_BLOOD", NOW).eligible, false);
  });

  test("weight limits are per component, not global", () => {
    const donor = makeDonor({ weightKg: 55 });
    // 55kg clears whole blood's 50kg floor but not double red cells' 59kg
    assert.strictEqual(checkEligibility(donor, "WHOLE_BLOOD", NOW).eligible, true);
    assert.strictEqual(checkEligibility(donor, "DOUBLE_RED_CELLS", NOW).eligible, false);
  });

  test("reaching the annual cap blocks until the new year", () => {
    const donor = makeDonor({
      eligibility: [{ component: "DOUBLE_RED_CELLS", donationsThisYear: 3 }],
    });
    const result = checkEligibility(donor, "DOUBLE_RED_CELLS", NOW);
    assert.strictEqual(result.eligible, false);
    assert.strictEqual(result.nextEligibleAt.toISOString().slice(0, 10), "2027-01-01");
  });

  test("all failures are collected, not just the first", () => {
    const donor = makeDonor({
      weightKg: 45,
      dateOfBirth: new Date("2012-01-01T00:00:00Z"),
      eligibility: [
        { component: "WHOLE_BLOOD", nextEligibleAt: new Date("2026-09-05T00:00:00Z") },
      ],
    });
    const result = checkEligibility(donor, "WHOLE_BLOOD", NOW);
    assert.strictEqual(result.eligible, false);
    assert.ok(result.reasons.length >= 3);
  });

  test("with two blocks active, the later date wins", () => {
    const donor = makeDonor({
      eligibility: [
        {
          component: "WHOLE_BLOOD",
          nextEligibleAt: new Date("2026-09-05T00:00:00Z"),
          medicallyDeferredUntil: new Date("2026-11-20T00:00:00Z"),
        },
      ],
    });
    const result = checkEligibility(donor, "WHOLE_BLOOD", NOW);
    assert.strictEqual(result.nextEligibleAt.toISOString().slice(0, 10), "2026-11-20");
  });

  test("a permanent block returns no future date", () => {
    const donor = makeDonor({ dateOfBirth: new Date("1950-01-01T00:00:00Z") });
    const result = checkEligibility(donor, "WHOLE_BLOOD", NOW);
    assert.strictEqual(result.eligible, false);
    assert.strictEqual(result.nextEligibleAt, null);
  });

  test("an unknown component throws", () => {
    assert.throws(() => checkEligibility(makeDonor(), "BONE_MARROW", NOW));
  });

  test("every declared component can be evaluated", () => {
    for (const c of COMPONENT_CODES) {
      assert.doesNotThrow(() => checkEligibility(makeDonor(), c, NOW));
    }
  });
});
});

describe("blood compatibility", () => {
  test("O- is the universal red cell donor", () => {
    for (const recipient of BLOOD_GROUPS) {
      assert.ok(
        isCompatible("O-", recipient, "WHOLE_BLOOD"),
        `O- should be able to give to ${recipient}`
      );
    }
  });

  test("AB+ is the universal red cell recipient", () => {
    for (const donor of BLOOD_GROUPS) {
      assert.ok(
        isCompatible(donor, "AB+", "WHOLE_BLOOD"),
        `AB+ should be able to receive from ${donor}`
      );
    }
  });

  test("AB is the universal plasma donor", () => {
    for (const recipient of BLOOD_GROUPS) {
      assert.ok(isCompatible("AB+", recipient, "PLASMA"));
      assert.ok(isCompatible("AB-", recipient, "PLASMA"));
    }
  });

  test("O is the universal plasma recipient", () => {
    for (const donor of BLOOD_GROUPS) {
      assert.ok(isCompatible(donor, "O+", "PLASMA"));
      assert.ok(isCompatible(donor, "O-", "PLASMA"));
    }
  });

  test("plasma runs opposite to red cells", () => {
    // O- gives red cells to everyone but receives plasma from everyone
    assert.ok(isCompatible("O-", "AB+", "WHOLE_BLOOD"));
    assert.ok(!isCompatible("O-", "AB+", "PLASMA"));

    // AB+ is the mirror image
    assert.ok(!isCompatible("AB+", "O-", "WHOLE_BLOOD"));
    assert.ok(isCompatible("AB+", "O-", "PLASMA"));
  });

  test("O- can only receive red cells from O-", () => {
    for (const donor of BLOOD_GROUPS) {
      const expected = donor === "O-";
      assert.strictEqual(isCompatible(donor, "O-", "WHOLE_BLOOD"), expected);
    }
  });

  test("Rh negative recipients cannot take positive red cells", () => {
    assert.ok(!isCompatible("O+", "O-", "WHOLE_BLOOD"));
    assert.ok(!isCompatible("A+", "A-", "WHOLE_BLOOD"));
    assert.ok(!isCompatible("B+", "B-", "WHOLE_BLOOD"));
    assert.ok(!isCompatible("AB+", "AB-", "WHOLE_BLOOD"));
  });

  test("platelets and double red cells use the red cell table", () => {
    for (const recipient of BLOOD_GROUPS) {
      assert.deepStrictEqual(
        compatibleDonorGroups(recipient, "PLATELETS"),
        compatibleDonorGroups(recipient, "WHOLE_BLOOD")
      );
      assert.deepStrictEqual(
        compatibleDonorGroups(recipient, "DOUBLE_RED_CELLS"),
        compatibleDonorGroups(recipient, "WHOLE_BLOOD")
      );
    }
  });

  test("every group can always receive from itself", () => {
    for (const group of BLOOD_GROUPS) {
      for (const component of COMPONENT_CODES) {
        assert.ok(
          isCompatible(group, group, component),
          `${group} should be self-compatible for ${component}`
        );
      }
    }
  });

  test("both tables cover every blood group", () => {
    for (const group of BLOOD_GROUPS) {
      assert.ok(Array.isArray(RED_CELL_COMPATIBILITY[group]));
      assert.ok(Array.isArray(PLASMA_COMPATIBILITY[group]));
    }
  });

  test("no table entry names an unknown group", () => {
    for (const table of [RED_CELL_COMPATIBILITY, PLASMA_COMPATIBILITY]) {
      for (const donors of Object.values(table)) {
        for (const d of donors) assert.ok(BLOOD_GROUPS.includes(d));
      }
    }
  });

  test("compatibility is not symmetric", () => {
    // If it were, the tables would be wrong
    assert.ok(isCompatible("O-", "A+", "WHOLE_BLOOD"));
    assert.ok(!isCompatible("A+", "O-", "WHOLE_BLOOD"));
  });

  test("unknown inputs throw", () => {
    assert.throws(() => compatibleDonorGroups("XY+", "WHOLE_BLOOD"));
    assert.throws(() => compatibleDonorGroups("O+", "BONE_MARROW"));
  });
});
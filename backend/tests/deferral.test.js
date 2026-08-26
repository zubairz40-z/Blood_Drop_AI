const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { Deferral, DEFERRAL_TYPES, DEFERRAL_REASONS, DEFERRAL_SOURCES } = require("../src/models/Deferral");

describe("Deferral model constants", () => {
  it("defines all required types", () => {
    assert.deepEqual(DEFERRAL_TYPES, ["temporary", "permanent"]);
  });

  it("defines all required sources", () => {
    assert.deepEqual(DEFERRAL_SOURCES, ["self", "hospital", "admin"]);
  });

  it("includes SCREENING_FAILED in reasons", () => {
    assert.ok(DEFERRAL_REASONS.includes("SCREENING_FAILED"));
  });

  it("includes at least 10 reason codes", () => {
    assert.ok(DEFERRAL_REASONS.length >= 10);
  });
});

describe("Deferral model schema validation", () => {
  it("has expected schema fields", () => {
    const paths = Object.keys(Deferral.schema.paths);
    assert.ok(paths.includes("donor"));
    assert.ok(paths.includes("reasonCode"));
    assert.ok(paths.includes("type"));
    assert.ok(paths.includes("startDate"));
    assert.ok(paths.includes("endDate"));
    assert.ok(paths.includes("source"));
    assert.ok(paths.includes("notes"));
  });

  it("has timestamps enabled", () => {
    const options = Deferral.schema.options;
    assert.equal(options.timestamps, true);
  });

  it("indexes donor field", () => {
    const indexes = Deferral.schema.indexes();
    const hasDonorIndex = indexes.some(
      (idx) => idx[0] && idx[0].donor !== undefined
    );
    assert.ok(hasDonorIndex, "Should have a donor index");
  });
});

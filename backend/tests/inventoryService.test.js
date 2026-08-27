const { describe, test, beforeEach, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");

const BloodInventory = require("../src/models/BloodInventory");
const inventoryService = require("../src/services/inventoryService");
const { BLOOD_GROUPS, COMPONENT_CODES } = require("../src/utils/donationRules");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFakeRow(overrides = {}) {
  return {
    _id: "6650f1a2b2c3d4e5f6a7b8c9",
    hospital: "hosp-1",
    bloodGroup: "O+",
    component: "WHOLE_BLOOD",
    units: 5,
    updatedBy: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeChain(result) {
  const chain = {};
  chain.sort = mock.fn(() => chain);
  chain.populate = mock.fn(() => chain);
  chain.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  chain[Symbol.toStringTag] = "Promise";
  return chain;
}

// ---------------------------------------------------------------------------
// Mock storage
// ---------------------------------------------------------------------------

let mocks = [];

function addMock(target, method, impl) {
  const m = mock.method(target, method, impl);
  mocks.push(m);
  return m;
}

function teardown() {
  for (const m of mocks) m.mock.restore();
  mocks = [];
}

// ===========================================================================
// Tests
// ===========================================================================

describe("inventoryService", () => {
  afterEach(teardown);

  // -------------------------------------------------------------------------
  // getInventory
  // -------------------------------------------------------------------------

  describe("getInventory", () => {
    test("queries BloodInventory for the given hospital", async () => {
      const chain = makeChain([]);
      addMock(BloodInventory, "find", mock.fn(() => chain));

      await inventoryService.getInventory("hosp-1");

      const q = BloodInventory.find.mock.calls[0].arguments[0];
      assert.equal(q.hospital, "hosp-1");
    });

    test("sorts by bloodGroup then component", async () => {
      const chain = makeChain([]);
      addMock(BloodInventory, "find", mock.fn(() => chain));

      await inventoryService.getInventory("hosp-1");

      assert.equal(chain.sort.mock.callCount(), 1);
      const sortArgs = chain.sort.mock.calls[0].arguments;
      assert.deepEqual(sortArgs, [{ bloodGroup: 1, component: 1 }]);
    });

    test("returns inventory rows", async () => {
      const rows = [makeFakeRow({ bloodGroup: "A+" }), makeFakeRow({ bloodGroup: "O+" })];
      const chain = makeChain(rows);
      addMock(BloodInventory, "find", mock.fn(() => chain));

      const result = await inventoryService.getInventory("hosp-1");
      assert.equal(result.length, 2);
    });

    test("cross-hospital isolation — different hospital returns different data", async () => {
      let lastQuery = null;
      const chain = makeChain([]);
      addMock(BloodInventory, "find", mock.fn((q) => {
        lastQuery = q;
        return chain;
      }));

      await inventoryService.getInventory("hosp-A");
      assert.equal(lastQuery.hospital, "hosp-A");

      teardown();
      const chain2 = makeChain([]);
      addMock(BloodInventory, "find", mock.fn((q) => {
        lastQuery = q;
        return chain2;
      }));

      await inventoryService.getInventory("hosp-B");
      assert.equal(lastQuery.hospital, "hosp-B");
      assert.notEqual("hosp-A", "hosp-B");
    });
  });

  // -------------------------------------------------------------------------
  // upsertInventory
  // -------------------------------------------------------------------------

  describe("upsertInventory", () => {
    test("rejects empty array", async () => {
      await assert.rejects(
        () => inventoryService.upsertInventory("hosp-1", [], "user-1"),
        (err) => {
          assert.equal(err.message, "items must be a non-empty array.");
          return true;
        }
      );
    });

    test("rejects non-array input", async () => {
      await assert.rejects(
        () => inventoryService.upsertInventory("hosp-1", null, "user-1"),
        (err) => {
          assert.equal(err.message, "items must be a non-empty array.");
          return true;
        }
      );
    });

    test("rejects invalid bloodGroup", async () => {
      const items = [{ bloodGroup: "Z+", component: "WHOLE_BLOOD", units: 5 }];
      await assert.rejects(
        () => inventoryService.upsertInventory("hosp-1", items, "user-1"),
        (err) => {
          assert.ok(err.message.includes("invalid bloodGroup"));
          return true;
        }
      );
    });

    test("rejects invalid component", async () => {
      const items = [{ bloodGroup: "O+", component: "SKIN", units: 5 }];
      await assert.rejects(
        () => inventoryService.upsertInventory("hosp-1", items, "user-1"),
        (err) => {
          assert.ok(err.message.includes("invalid component"));
          return true;
        }
      );
    });

    test("rejects negative units", async () => {
      const items = [{ bloodGroup: "O+", component: "WHOLE_BLOOD", units: -3 }];
      await assert.rejects(
        () => inventoryService.upsertInventory("hosp-1", items, "user-1"),
        (err) => {
          assert.ok(err.message.includes("non-negative"));
          return true;
        }
      );
    });

    test("rejects non-numeric units", async () => {
      const items = [{ bloodGroup: "O+", component: "WHOLE_BLOOD", units: "five" }];
      await assert.rejects(
        () => inventoryService.upsertInventory("hosp-1", items, "user-1"),
        (err) => {
          assert.ok(err.message.includes("non-negative"));
          return true;
        }
      );
    });

    test("rejects before touching database — no bulkWrite called", async () => {
      addMock(BloodInventory, "bulkWrite", mock.fn(async () => {}));
      addMock(BloodInventory, "find", mock.fn(() => makeChain([])));

      await assert.rejects(
        () => inventoryService.upsertInventory("hosp-1", [{ bloodGroup: "Z+", component: "X", units: 1 }], "user-1")
      );

      assert.equal(BloodInventory.bulkWrite.mock.callCount(), 0);
    });

    test("calls bulkWrite with correct upsert operations", async () => {
      addMock(BloodInventory, "bulkWrite", mock.fn(async () => {}));
      addMock(BloodInventory, "find", mock.fn(() => makeChain([])));

      const items = [
        { bloodGroup: "O+", component: "WHOLE_BLOOD", units: 10 },
        { bloodGroup: "A+", component: "PLASMA", units: 5 },
      ];

      await inventoryService.upsertInventory("hosp-1", items, "user-1");

      assert.equal(BloodInventory.bulkWrite.mock.callCount(), 1);
      const ops = BloodInventory.bulkWrite.mock.calls[0].arguments[0];
      assert.equal(ops.length, 2);

      // First operation
      assert.deepEqual(ops[0].updateOne.filter, {
        hospital: "hosp-1",
        bloodGroup: "O+",
        component: "WHOLE_BLOOD",
      });
      assert.deepEqual(ops[0].updateOne.update, {
        $set: { units: 10, updatedBy: "user-1" },
      });
      assert.equal(ops[0].updateOne.upsert, true);

      // Second operation
      assert.deepEqual(ops[1].updateOne.filter, {
        hospital: "hosp-1",
        bloodGroup: "A+",
        component: "PLASMA",
      });
    });

    test("returns updated inventory after bulkWrite", async () => {
      const rows = [makeFakeRow({ units: 10 })];
      addMock(BloodInventory, "bulkWrite", mock.fn(async () => {}));
      addMock(BloodInventory, "find", mock.fn(() => makeChain(rows)));

      const result = await inventoryService.upsertInventory(
        "hosp-1",
        [{ bloodGroup: "O+", component: "WHOLE_BLOOD", units: 10 }],
        "user-1"
      );

      assert.equal(result.length, 1);
      assert.equal(result[0].units, 10);
    });
  });

  // -------------------------------------------------------------------------
  // adjustUnits
  // -------------------------------------------------------------------------

  describe("adjustUnits", () => {
    test("increments units by the given delta (and upserts the row)", async () => {
      const updated = makeFakeRow({ units: 8 });
      addMock(BloodInventory, "findOneAndUpdate", mock.fn(async () => updated));

      const result = await inventoryService.adjustUnits("hosp-1", "O+", "WHOLE_BLOOD", 3);

      const q = BloodInventory.findOneAndUpdate.mock.calls[0].arguments[0];
      assert.equal(q.hospital, "hosp-1");
      assert.equal(q.bloodGroup, "O+");
      assert.equal(q.component, "WHOLE_BLOOD");
      // Adding stock cannot go negative, so there is no units guard on the
      // positive-delta path — it must create the row if it does not exist yet.
      assert.equal(q.units, undefined);

      const update = BloodInventory.findOneAndUpdate.mock.calls[0].arguments[1];
      assert.deepEqual(update.$inc, { units: 3 });
      assert.ok(update.$setOnInsert, "positive delta should $setOnInsert on upsert");

      const opts = BloodInventory.findOneAndUpdate.mock.calls[0].arguments[2];
      assert.equal(opts.upsert, true);
      assert.equal(opts.new, true);

      assert.equal(result.units, 8);
    });

    test("decrements units with negative delta", async () => {
      const updated = makeFakeRow({ units: 2 });
      addMock(BloodInventory, "findOneAndUpdate", mock.fn(async () => updated));

      await inventoryService.adjustUnits("hosp-1", "O+", "WHOLE_BLOOD", -3);

      const q = BloodInventory.findOneAndUpdate.mock.calls[0].arguments[0];
      // For delta=-3, $gte: -(-3) = 3, so only proceed if current units >= 3
      assert.deepEqual(q.units, { $gte: 3 });
    });

    test("returns null when adjustment would go below 0", async () => {
      addMock(BloodInventory, "findOneAndUpdate", mock.fn(async () => null));

      const result = await inventoryService.adjustUnits("hosp-1", "O+", "WHOLE_BLOOD", -5);
      assert.equal(result, null);
    });

    test("positive delta passes { new: true, upsert: true }", async () => {
      addMock(BloodInventory, "findOneAndUpdate", mock.fn(async () => makeFakeRow()));

      await inventoryService.adjustUnits("hosp-1", "O+", "WHOLE_BLOOD", 1);

      const opts = BloodInventory.findOneAndUpdate.mock.calls[0].arguments[2];
      assert.deepEqual(opts, { new: true, upsert: true });
    });

    test("negative delta keeps the guarded, non-upserting path { new: true }", async () => {
      addMock(BloodInventory, "findOneAndUpdate", mock.fn(async () => makeFakeRow()));

      await inventoryService.adjustUnits("hosp-1", "O+", "WHOLE_BLOOD", -1);

      const opts = BloodInventory.findOneAndUpdate.mock.calls[0].arguments[2];
      assert.deepEqual(opts, { new: true });
    });

    test("deterministic — same inputs produce same query", async () => {
      addMock(BloodInventory, "findOneAndUpdate", mock.fn(async () => makeFakeRow()));

      await inventoryService.adjustUnits("hosp-1", "A-", "PLATELETS", 2);
      const q1 = JSON.parse(JSON.stringify(
        BloodInventory.findOneAndUpdate.mock.calls[0].arguments[0]
      ));

      teardown();
      addMock(BloodInventory, "findOneAndUpdate", mock.fn(async () => makeFakeRow()));

      await inventoryService.adjustUnits("hosp-1", "A-", "PLATELETS", 2);
      const q2 = JSON.parse(JSON.stringify(
        BloodInventory.findOneAndUpdate.mock.calls[0].arguments[0]
      ));

      assert.deepEqual(q1, q2);
    });
  });

  // -------------------------------------------------------------------------
  // initializeDefaultInventory
  // -------------------------------------------------------------------------

  describe("initializeDefaultInventory", () => {
    test("creates 32 rows (8 blood groups x 4 components)", async () => {
      addMock(BloodInventory, "bulkWrite", mock.fn(async () => {}));
      addMock(BloodInventory, "find", mock.fn(() => makeChain([])));

      await inventoryService.initializeDefaultInventory("hosp-1", "user-1");

      const ops = BloodInventory.bulkWrite.mock.calls[0].arguments[0];
      assert.equal(ops.length, BLOOD_GROUPS.length * COMPONENT_CODES.length);
      assert.equal(ops.length, 32);
    });

    test("all operations are upserts with $setOnInsert", async () => {
      addMock(BloodInventory, "bulkWrite", mock.fn(async () => {}));
      addMock(BloodInventory, "find", mock.fn(() => makeChain([])));

      await inventoryService.initializeDefaultInventory("hosp-1", "user-1");

      const ops = BloodInventory.bulkWrite.mock.calls[0].arguments[0];
      for (const op of ops) {
        assert.equal(op.updateOne.upsert, true);
        assert.deepEqual(op.updateOne.update, {
          $setOnInsert: { units: 0, updatedBy: "user-1" },
        });
      }
    });

    test("every blood group and component combination is present", async () => {
      addMock(BloodInventory, "bulkWrite", mock.fn(async () => {}));
      addMock(BloodInventory, "find", mock.fn(() => makeChain([])));

      await inventoryService.initializeDefaultInventory("hosp-1", "user-1");

      const ops = BloodInventory.bulkWrite.mock.calls[0].arguments[0];
      const pairs = ops.map((op) => {
        const f = op.updateOne.filter;
        return `${f.bloodGroup}|${f.component}`;
      });

      for (const bg of BLOOD_GROUPS) {
        for (const comp of COMPONENT_CODES) {
          assert.ok(pairs.includes(`${bg}|${comp}`), `missing ${bg}/${comp}`);
        }
      }
    });

    test("returns inventory after initialization", async () => {
      const rows = BLOOD_GROUPS.flatMap((bg) =>
        COMPONENT_CODES.map((comp) => makeFakeRow({ bloodGroup: bg, component: comp, units: 0 }))
      );
      addMock(BloodInventory, "bulkWrite", mock.fn(async () => {}));
      addMock(BloodInventory, "find", mock.fn(() => makeChain(rows)));

      const result = await inventoryService.initializeDefaultInventory("hosp-1", "user-1");
      assert.equal(result.length, 32);
    });

    test("does not overwrite existing rows (uses $setOnInsert)", async () => {
      addMock(BloodInventory, "bulkWrite", mock.fn(async () => {}));
      addMock(BloodInventory, "find", mock.fn(() => makeChain([])));

      await inventoryService.initializeDefaultInventory("hosp-1", "user-1");

      const ops = BloodInventory.bulkWrite.mock.calls[0].arguments[0];
      // Verify none of the ops use $set (only $setOnInsert)
      for (const op of ops) {
        assert.ok(!("$set" in op.updateOne.update), "should not use $set, only $setOnInsert");
        assert.ok("$setOnInsert" in op.updateOne.update);
      }
    });
  });
});

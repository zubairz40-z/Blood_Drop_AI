const { test, describe } = require("node:test");
const assert = require("node:assert");

// ---------------------------------------------------------------------------
// Test the createRequest controller's location validation.
//
// Business rule: a blood request MUST have a valid GeoJSON location for
// donor matching. If neither the hospital profile nor the client provides
// coordinates, the controller returns 400 instead of saving malformed
// { type: "Point" } with no coordinates.
// ---------------------------------------------------------------------------

describe("Hospital request geo validation", () => {
  function makeRes() {
    const res = { _status: null, _json: null };
    res.status = function (code) {
      res._status = code;
      return res;
    };
    res.json = function (obj) {
      res._json = obj;
      return res;
    };
    return res;
  }

  // Captures next(err) calls
  function makeNext(errors) {
    return function next(err) {
      if (err) errors.push(err);
    };
  }

  /**
   * Loads the controller fresh with mocked models injected into the require cache.
   * Returns the controller functions and a cleanup function.
   */
  function loadControllerWithMocks(userFindByIdFn) {
    // Mock User model
    const mockUser = {
      findOne: async () => null,
      findById: userFindByIdFn || (async () => null),
    };

    let lastCreated = null;
    const mockBloodRequest = {
      create: async (data) => {
        lastCreated = data;
        return { _id: "created-001", ...data, save: async () => ({}) };
      },
      find: async () => ({ sort: () => ({ populate: () => ({ populate: () => [] }) }) }),
      findById: async () => null,
    };

    const userPath = require.resolve("../src/models/User");
    const brPath = require.resolve("../src/models/BloodRequest");
    const ctrlPath = require.resolve("../src/controllers/requestController");

    // Save originals
    const origUser = require.cache[userPath];
    const origBR = require.cache[brPath];
    const origCtrl = require.cache[ctrlPath];

    require.cache[userPath] = { id: userPath, filename: userPath, loaded: true, exports: mockUser };
    require.cache[brPath] = { id: brPath, filename: brPath, loaded: true, exports: mockBloodRequest };
    delete require.cache[ctrlPath];

    const { createRequest } = require(ctrlPath);

    return {
      createRequest,
      getLastCreated: () => lastCreated,
      restore: () => {
        if (origUser) require.cache[userPath] = origUser;
        else delete require.cache[userPath];
        if (origBR) require.cache[brPath] = origBR;
        else delete require.cache[brPath];
        if (origCtrl) require.cache[ctrlPath] = origCtrl;
        else delete require.cache[ctrlPath];
      },
    };
  }

  // -----------------------------------------------------------------------
  test("hospital request with valid hospital coordinates stores valid GeoJSON", async () => {
    const hospitalDoc = {
      _id: "hospital-001",
      role: "hospital",
      location: { type: "Point", coordinates: [90.4125, 23.7461] },
      address: "Dhanmondi, Dhaka",
    };

    // For hospital-created requests, currentUser IS the hospital doc
    const ctrl = loadControllerWithMocks(async () => hospitalDoc);
    try {
      const req = {
        currentUser: {
          _id: "hospital-001",
          role: "hospital",
          location: { type: "Point", coordinates: [90.4125, 23.7461] },
          address: "Dhanmondi, Dhaka",
        },
        body: {
          patientName: "Test Patient",
          bloodGroup: "O+",
          component: "WHOLE_BLOOD",
          unitsRequired: 2,
          urgency: "EMERGENCY",
          neededBy: new Date(Date.now() + 86400000).toISOString(),
        },
      };
      const res = makeRes();
      const errors = [];
      await ctrl.createRequest(req, res, makeNext(errors));

      assert.strictEqual(errors.length, 0, `Unexpected error: ${errors[0]?.message}`);
      assert.strictEqual(res._status, 201, `Got ${res._status}: ${JSON.stringify(res._json)}`);

      const saved = ctrl.getLastCreated();
      assert.strictEqual(saved.location.type, "Point");
      assert.deepStrictEqual(saved.location.coordinates, [90.4125, 23.7461]);
      assert.strictEqual(saved.location.address, "Dhanmondi, Dhaka");
      assert.strictEqual(saved.status, "VERIFIED");
    } finally {
      ctrl.restore();
    }
  });

  // -----------------------------------------------------------------------
  test("hospital request with NO coordinates returns 400 instead of saving malformed GeoJSON", async () => {
    const ctrl = loadControllerWithMocks(async () => null);
    try {
      const req = {
        currentUser: {
          _id: "hospital-002",
          role: "hospital",
          location: { type: "Point" },
          address: "",
        },
        body: {
          patientName: "Test Patient",
          bloodGroup: "O+",
          component: "WHOLE_BLOOD",
          unitsRequired: 2,
          urgency: "EMERGENCY",
          neededBy: new Date(Date.now() + 86400000).toISOString(),
        },
      };
      const res = makeRes();
      const errors = [];
      await ctrl.createRequest(req, res, makeNext(errors));

      assert.strictEqual(res._status, 400, `Expected 400 but got ${res._status}: ${JSON.stringify(res._json)}`);
      assert.strictEqual(res._json.success, false);
      assert.ok(
        res._json.message.toLowerCase().includes("location"),
        `Error should mention location. Got: "${res._json.message}"`
      );
      assert.strictEqual(ctrl.getLastCreated(), null, "No request should be saved when location is missing");
    } finally {
      ctrl.restore();
    }
  });

  // -----------------------------------------------------------------------
  test("hospital request with completely missing location field returns 400", async () => {
    const ctrl = loadControllerWithMocks(async () => null);
    try {
      const req = {
        currentUser: {
          _id: "hospital-003",
          role: "hospital",
          // No location property at all
        },
        body: {
          patientName: "Unidentified Emergency",
          bloodGroup: "B+",
          component: "PLASMA",
          unitsRequired: 1,
          urgency: "EMERGENCY",
          neededBy: new Date(Date.now() + 86400000).toISOString(),
        },
      };
      const res = makeRes();
      const errors = [];
      await ctrl.createRequest(req, res, makeNext(errors));

      assert.strictEqual(res._status, 400);
      assert.strictEqual(res._json.success, false);
      assert.ok(res._json.message.toLowerCase().includes("location"));
    } finally {
      ctrl.restore();
    }
  });
});

const { test, describe, mock } = require("node:test");
const assert = require("node:assert");

// ---------------------------------------------------------------------------
// Mock the BloodRequest model and orchestrator before importing controller
// ---------------------------------------------------------------------------

const REQUEST_ID = "6650f1a2b2c3d4e5f6a7b8c9";
const PATIENT_ID = "patient-001";
const OTHER_PATIENT_ID = "patient-002";
const HOSPITAL_ID = "hospital-001";

function makeCoordinationResult(requestId) {
  return {
    requestId,
    risk: "LOW",
    riskScore: 0,
    recommendedDonor: null,
    backupDonors: [],
    nextAction: "EXPAND_SEARCH",
    explanation: "No candidates found.",
    agentStatus: { matching: "COMPLETED", eligibility: "COMPLETED", geo: "COMPLETED", risk: "COMPLETED" },
  };
}

// Simulate the BloodRequest collection
const fakeRequests = {
  [REQUEST_ID]: { _id: REQUEST_ID, patient: PATIENT_ID, hospital: HOSPITAL_ID },
};

// Mock modules
const BloodRequest = {
  findById: (id) => ({
    select: () => ({
      lean: () => Promise.resolve(fakeRequests[id] || null),
    }),
  }),
};

const orchestratorMock = {
  coordinateRealRequest: async ({ requestId }) => makeCoordinationResult(requestId),
};

// Inject mocks into require cache
const brPath = require.resolve("../src/models/BloodRequest");
const ctrlPath = require.resolve("../src/controllers/aiController");
const orchPath = require.resolve("../src/services/aiOrchestrator");

const origBR = require.cache[brPath];
const origCtrl = require.cache[ctrlPath];
const origOrch = require.cache[orchPath];

require.cache[brPath] = { id: brPath, filename: brPath, loaded: true, exports: BloodRequest };
require.cache[orchPath] = { id: orchPath, filename: orchPath, loaded: true, exports: orchestratorMock };
delete require.cache[ctrlPath];

const { coordinateBloodRequest } = require(ctrlPath);

function restore() {
  if (origBR) require.cache[brPath] = origBR; else delete require.cache[brPath];
  if (origOrch) require.cache[orchPath] = origOrch; else delete require.cache[orchPath];
  if (origCtrl) require.cache[ctrlPath] = origCtrl; else delete require.cache[ctrlPath];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRes() {
  const res = { _status: null, _json: null };
  res.status = function (code) { res._status = code; return res; };
  res.json = function (obj) { res._json = obj; return res; };
  return res;
}

function makeNext(errors) {
  return function next(err) {
    if (err) errors.push(err);
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AI Controller — coordinateBloodRequest", () => {
  test("missing requestId returns 400", async () => {
    const req = { body: {}, currentUser: { _id: HOSPITAL_ID, role: "hospital" } };
    const res = makeRes();
    await coordinateBloodRequest(req, res, makeNext([]));

    assert.equal(res._status, 400);
    assert.equal(res._json.success, false);
    assert.ok(res._json.message.includes("requestId"));
  });

  test("hospital can coordinate any request", async () => {
    const req = { body: { requestId: REQUEST_ID }, currentUser: { _id: HOSPITAL_ID, role: "hospital" } };
    const res = makeRes();
    await coordinateBloodRequest(req, res, makeNext([]));

    assert.equal(res._status, 200);
    assert.equal(res._json.success, true);
    assert.equal(res._json.result.requestId, REQUEST_ID);
  });

  test("admin can coordinate any request", async () => {
    const req = { body: { requestId: REQUEST_ID }, currentUser: { _id: "admin-001", role: "admin" } };
    const res = makeRes();
    await coordinateBloodRequest(req, res, makeNext([]));

    assert.equal(res._status, 200);
    assert.equal(res._json.success, true);
  });

  test("patient can coordinate own request", async () => {
    const req = { body: { requestId: REQUEST_ID }, currentUser: { _id: PATIENT_ID, role: "patient" } };
    const res = makeRes();
    await coordinateBloodRequest(req, res, makeNext([]));

    assert.equal(res._status, 200);
    assert.equal(res._json.success, true);
  });

  test("patient CANNOT coordinate another patient's request", async () => {
    const req = { body: { requestId: REQUEST_ID }, currentUser: { _id: OTHER_PATIENT_ID, role: "patient" } };
    const res = makeRes();
    await coordinateBloodRequest(req, res, makeNext([]));

    assert.equal(res._status, 403);
    assert.equal(res._json.success, false);
    assert.ok(res._json.message.includes("own"));
  });

  test("patient gets 404 for nonexistent request", async () => {
    const req = { body: { requestId: "000000000000000000000000" }, currentUser: { _id: PATIENT_ID, role: "patient" } };
    const res = makeRes();
    await coordinateBloodRequest(req, res, makeNext([]));

    assert.equal(res._status, 404);
  });

  test("empty body returns 400", async () => {
    const req = { body: {}, currentUser: { _id: HOSPITAL_ID, role: "hospital" } };
    const res = makeRes();
    await coordinateBloodRequest(req, res, makeNext([]));

    assert.equal(res._status, 400);
  });

  test("output has expected coordination contract", async () => {
    const req = { body: { requestId: REQUEST_ID }, currentUser: { _id: HOSPITAL_ID, role: "hospital" } };
    const res = makeRes();
    await coordinateBloodRequest(req, res, makeNext([]));

    const r = res._json.result;
    assert.equal(typeof r.requestId, "string");
    assert.equal(typeof r.risk, "string");
    assert.equal(typeof r.riskScore, "number");
    assert.ok(r.recommendedDonor === null || typeof r.recommendedDonor === "string");
    assert.ok(Array.isArray(r.backupDonors));
    assert.equal(typeof r.nextAction, "string");
    assert.equal(typeof r.explanation, "string");
  });

  test("determinism — same input gives same output", async () => {
    const req1 = { body: { requestId: REQUEST_ID }, currentUser: { _id: HOSPITAL_ID, role: "hospital" } };
    const res1 = makeRes();
    await coordinateBloodRequest(req1, res1, makeNext([]));

    const req2 = { body: { requestId: REQUEST_ID }, currentUser: { _id: HOSPITAL_ID, role: "hospital" } };
    const res2 = makeRes();
    await coordinateBloodRequest(req2, res2, makeNext([]));

    assert.deepEqual(res1._json.result, res2._json.result);
  });

  // Restore after all tests
  test("cleanup", () => {
    restore();
  });
});

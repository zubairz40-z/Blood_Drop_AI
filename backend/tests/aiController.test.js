const { test, describe } = require("node:test");
const assert = require("node:assert");
const { coordinateBloodRequest } = require("../src/controllers/aiController");

// ---------------------------------------------------------------------------
// Helper — builds a minimal mock req/res/next for testing Express handlers.
// ---------------------------------------------------------------------------

function makeReq(body = {}) {
  return { body };
}

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

function makeNext() {
  return function next(err) {
    if (err) throw err;
  };
}

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const VALID_PAYLOAD = {
  request: {
    id: "demo-request-001",
    urgency: "URGENT",
    bloodGroup: "O+",
    component: "WHOLE_BLOOD",
    unitsRequired: 2,
  },
  matchingResult: {
    requestId: "demo-request-001",
    candidates: [
      {
        donorId: "demo-donor-001",
        eligible: true,
        available: true,
        score: 92,
        reasons: ["Compatible", "Nearby"],
        distanceKm: 3.2,
        etaMinutes: 14,
      },
      {
        donorId: "demo-donor-002",
        eligible: true,
        available: true,
        score: 84,
        reasons: ["Compatible"],
        distanceKm: 6.7,
        etaMinutes: 23,
      },
    ],
  },
  eligibilityResult: {
    eligibleDonorIds: ["demo-donor-001", "demo-donor-002"],
  },
  geoResult: {
    rankedDonorIds: ["demo-donor-001", "demo-donor-002"],
  },
  riskContext: {
    requestCountRecent: 0,
    emergencyRequestsRecent: 0,
    cancelledRequestsRecent: 0,
    donorActivityCount: 0,
    emergencyResponseMinutes: 0,
    bloodGroupDemandCount: 0,
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AI Controller — coordinateBloodRequest", () => {
  test("valid payload returns 200 with coordination result", async () => {
    const req = makeReq(VALID_PAYLOAD);
    const res = makeRes();
    await coordinateBloodRequest(req, res, makeNext());

    assert.equal(res._status, 200);
    assert.equal(res._json.success, true);
    assert.ok(res._json.result, "result should be present");
  });

  test("output matches expected coordination contract", async () => {
    const req = makeReq(VALID_PAYLOAD);
    const res = makeRes();
    await coordinateBloodRequest(req, res, makeNext());

    const r = res._json.result;
    assert.equal(typeof r.requestId, "string");
    assert.equal(typeof r.risk, "string");
    assert.equal(typeof r.riskScore, "number");
    assert.ok(
      r.recommendedDonor === null || typeof r.recommendedDonor === "string"
    );
    assert.ok(Array.isArray(r.backupDonors));
    assert.equal(typeof r.nextAction, "string");
    assert.equal(typeof r.explanation, "string");
  });

  test("no candidates returns EXPAND_SEARCH", async () => {
    const payload = {
      ...VALID_PAYLOAD,
      matchingResult: { requestId: "demo-request-001", candidates: [] },
    };
    const req = makeReq(payload);
    const res = makeRes();
    await coordinateBloodRequest(req, res, makeNext());

    assert.equal(res._json.result.recommendedDonor, null);
    assert.equal(res._json.result.nextAction, "EXPAND_SEARCH");
  });

  test("missing request returns 400", async () => {
    const req = makeReq({ matchingResult: VALID_PAYLOAD.matchingResult });
    const res = makeRes();
    await coordinateBloodRequest(req, res, makeNext());

    assert.equal(res._status, 400);
    assert.equal(res._json.success, false);
  });

  test("request without id returns 400", async () => {
    const req = makeReq({ request: { bloodGroup: "O+" } });
    const res = makeRes();
    await coordinateBloodRequest(req, res, makeNext());

    assert.equal(res._status, 400);
    assert.equal(res._json.success, false);
  });

  test("empty body returns 400", async () => {
    const req = makeReq({});
    const res = makeRes();
    await coordinateBloodRequest(req, res, makeNext());

    assert.equal(res._status, 400);
  });

  test("missing optional fields handled safely", async () => {
    const req = makeReq({
      request: VALID_PAYLOAD.request,
    });
    const res = makeRes();
    await coordinateBloodRequest(req, res, makeNext());

    assert.equal(res._status, 200);
    assert.ok(res._json.result);
  });

  test("critical risk with candidates returns MANUAL_REVIEW_REQUIRED", async () => {
    const payload = {
      ...VALID_PAYLOAD,
      riskContext: {
        requestCountRecent: 25,
        emergencyRequestsRecent: 6,
        cancelledRequestsRecent: 7,
        donorActivityCount: 31,
        emergencyResponseMinutes: 61,
        bloodGroupDemandCount: 9,
      },
    };
    const req = makeReq(payload);
    const res = makeRes();
    await coordinateBloodRequest(req, res, makeNext());

    assert.equal(res._json.result.risk, "CRITICAL");
    assert.equal(res._json.result.nextAction, "MANUAL_REVIEW_REQUIRED");
  });

  test("determinism — same input gives same output", async () => {
    const req1 = makeReq(VALID_PAYLOAD);
    const res1 = makeRes();
    await coordinateBloodRequest(req1, res1, makeNext());

    const req2 = makeReq(VALID_PAYLOAD);
    const res2 = makeRes();
    await coordinateBloodRequest(req2, res2, makeNext());

    assert.deepEqual(res1._json.result, res2._json.result);
  });
});

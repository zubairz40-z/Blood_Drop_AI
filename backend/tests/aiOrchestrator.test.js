const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { coordinateRequest } = require("../src/services/aiOrchestrator");

// ---------------------------------------------------------------------------
// Reusable fixtures
// ---------------------------------------------------------------------------

function makeRequest(id = "demo-request-001", urgency = "URGENT") {
  return {
    id,
    urgency,
    bloodGroup: "O+",
    component: "WHOLE_BLOOD",
    unitsRequired: 2,
  };
}

function makeCandidate(donorId, overrides = {}) {
  return {
    donorId,
    eligible: true,
    available: true,
    score: 90,
    reasons: ["compatible", "nearby"],
    distanceKm: 2.5,
    etaMinutes: 10,
    ...overrides,
  };
}

function makeMatchingResult(candidates = [makeCandidate("demo-donor-001"), makeCandidate("demo-donor-002")]) {
  return { requestId: "demo-request-001", candidates };
}

function makeEligibilityResult(ids = ["demo-donor-001", "demo-donor-002"]) {
  return { eligibleDonorIds: ids };
}

function makeGeoResult(ids = ["demo-donor-001", "demo-donor-002"]) {
  return { rankedDonorIds: ids };
}

function makeRiskContext(overrides = {}) {
  return {
    requestCountRecent: 0,
    emergencyRequestsRecent: 0,
    cancelledRequestsRecent: 0,
    donorActivityCount: 0,
    emergencyResponseMinutes: 0,
    bloodGroupDemandCount: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("aiOrchestrator", () => {
  test("good matching flow returns primary donor", () => {
    const result = coordinateRequest({
      request: makeRequest(),
      matchingResult: makeMatchingResult(),
    });

    assert.equal(result.recommendedDonor, "demo-donor-001");
    assert.equal(result.nextAction, "CONTACT_PRIMARY_DONOR");
  });

  test("backup donors preserved in correct order", () => {
    const candidates = [
      makeCandidate("donor-1"),
      makeCandidate("donor-2"),
      makeCandidate("donor-3"),
    ];

    const result = coordinateRequest({
      request: makeRequest(),
      matchingResult: makeMatchingResult(candidates),
    });

    assert.deepEqual(result.backupDonors, ["donor-2", "donor-3"]);
    assert.equal(result.recommendedDonor, "donor-1");
  });

  test("Risk Agent output reaches final result", () => {
    const result = coordinateRequest({
      request: makeRequest(),
      matchingResult: makeMatchingResult(),
      riskContext: makeRiskContext({
        requestCountRecent: 25,
        emergencyRequestsRecent: 6,
        cancelledRequestsRecent: 0,
        donorActivityCount: 0,
        emergencyResponseMinutes: 0,
        bloodGroupDemandCount: 0,
      }),
    });

    // requestCountRecent=25 (20 weight) + emergencyRequestsRecent=6 (25 weight) = 45 → MEDIUM
    assert.equal(result.riskScore, 45);
    assert.equal(result.risk, "MEDIUM");
    assert.equal(typeof result.riskScore, "number");
    assert.equal(typeof result.risk, "string");
  });

  test("high risk score reaches final result", () => {
    const result = coordinateRequest({
      request: makeRequest(),
      matchingResult: makeMatchingResult(),
      riskContext: makeRiskContext({
        requestCountRecent: 25,
        emergencyRequestsRecent: 6,
        cancelledRequestsRecent: 7,
        donorActivityCount: 31,
        emergencyResponseMinutes: 61,
        bloodGroupDemandCount: 9,
      }),
    });

    // all signals above thresholds → 20+25+15+10+20+15 = 105 → clamped 100 → CRITICAL
    assert.equal(result.riskScore, 100);
    assert.equal(result.risk, "CRITICAL");
  });

  test("no candidates at all returns EXPAND_SEARCH", () => {
    const result = coordinateRequest({
      request: makeRequest(),
      matchingResult: makeMatchingResult([]),
    });

    assert.equal(result.recommendedDonor, null);
    assert.deepEqual(result.backupDonors, []);
    assert.equal(result.nextAction, "EXPAND_SEARCH");
  });

  test("candidates present but none eligible returns NO_ELIGIBLE_CANDIDATES", () => {
    const ineligible = [
      makeCandidate("donor-1", { eligible: false }),
      makeCandidate("donor-2", { eligible: false }),
    ];

    const result = coordinateRequest({
      request: makeRequest(),
      matchingResult: makeMatchingResult(ineligible),
    });

    assert.equal(result.recommendedDonor, null);
    assert.equal(result.nextAction, "NO_ELIGIBLE_CANDIDATES");
  });

  test("missing riskContext handled safely with defaults", () => {
    const result = coordinateRequest({
      request: makeRequest(),
      matchingResult: makeMatchingResult(),
      riskContext: undefined,
    });

    // all zeros → risk score 0, LOW
    assert.equal(result.riskScore, 0);
    assert.equal(result.risk, "LOW");
    assert.equal(result.recommendedDonor, "demo-donor-001");
  });

  test("malformed request returns predictable validation error", () => {
    const result = coordinateRequest({ request: null });

    assert.equal(result.requestId, null);
    assert.equal(result.nextAction, "MANUAL_REVIEW_REQUIRED");
    assert.equal(result.recommendedDonor, null);
    assert.equal(typeof result.explanation, "string");
  });

  test("same input gives same output (determinism)", () => {
    const input = {
      request: makeRequest(),
      matchingResult: makeMatchingResult(),
      riskContext: makeRiskContext(),
    };

    const r1 = coordinateRequest(input);
    const r2 = coordinateRequest(input);

    assert.deepEqual(r1, r2);
  });

  test("final output matches expected coordination contract", () => {
    const result = coordinateRequest({
      request: makeRequest(),
      matchingResult: makeMatchingResult(),
      riskContext: makeRiskContext(),
    });

    // Every field required by the contract must be present
    assert.equal(typeof result.requestId, "string");
    assert.equal(typeof result.risk, "string");
    assert.equal(typeof result.riskScore, "number");
    assert.ok(
      result.recommendedDonor === null || typeof result.recommendedDonor === "string",
      "recommendedDonor must be null or string"
    );
    assert.ok(Array.isArray(result.backupDonors), "backupDonors must be array");
    assert.equal(typeof result.nextAction, "string");
    assert.equal(typeof result.explanation, "string");

    // Must be one of the valid next actions
    const validActions = [
      "CONTACT_PRIMARY_DONOR",
      "EXPAND_SEARCH",
      "NO_ELIGIBLE_CANDIDATES",
      "MANUAL_REVIEW_REQUIRED",
    ];
    assert.ok(validActions.includes(result.nextAction), `unexpected nextAction: ${result.nextAction}`);
  });

  test("eligibility and geo results preserved in output", () => {
    const result = coordinateRequest({
      request: makeRequest(),
      matchingResult: makeMatchingResult(),
      eligibilityResult: makeEligibilityResult(),
      geoResult: makeGeoResult(),
      riskContext: makeRiskContext(),
    });

    assert.deepEqual(result.eligibilityResult, makeEligibilityResult());
    assert.deepEqual(result.geoResult, makeGeoResult());
  });

  test("missing request object returns validation error", () => {
    const result = coordinateRequest({});

    assert.equal(result.requestId, null);
    assert.equal(result.nextAction, "MANUAL_REVIEW_REQUIRED");
  });

  test("empty input object returns validation error", () => {
    const result = coordinateRequest();

    assert.equal(result.requestId, null);
    assert.equal(result.nextAction, "MANUAL_REVIEW_REQUIRED");
  });

  test("non-object request returns validation error", () => {
    const result = coordinateRequest({ request: "bad" });

    assert.equal(result.requestId, null);
    assert.equal(result.nextAction, "MANUAL_REVIEW_REQUIRED");
  });

  test("null matchingResult treated as no candidates → EXPAND_SEARCH", () => {
    const result = coordinateRequest({
      request: makeRequest(),
      matchingResult: null,
    });

    assert.equal(result.recommendedDonor, null);
    assert.equal(result.nextAction, "EXPAND_SEARCH");
  });

  test("candidates present but no available donors returns NO_ELIGIBLE_CANDIDATES", () => {
    const unavailable = [
      makeCandidate("donor-1", { available: false }),
    ];

    const result = coordinateRequest({
      request: makeRequest(),
      matchingResult: makeMatchingResult(unavailable),
    });

    assert.equal(result.recommendedDonor, null);
    assert.equal(result.nextAction, "NO_ELIGIBLE_CANDIDATES");
  });
});

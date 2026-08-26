const { test, describe } = require("node:test");
const assert = require("node:assert");
const { coordinate, ACTIONS } = require("../src/agents/aiManager");

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const twoCandidateMatching = {
  candidates: [
    {
      donorId: "demo-donor-001",
      bloodGroup: "O+",
      component: "WHOLE_BLOOD",
      eligible: true,
      available: true,
      distanceKm: 3.2,
      etaMinutes: 14,
      score: 92,
      reasons: ["Compatible blood group", "Eligible", "Available", "Nearby"],
    },
    {
      donorId: "demo-donor-002",
      bloodGroup: "O+",
      component: "WHOLE_BLOOD",
      eligible: true,
      available: true,
      distanceKm: 6.7,
      etaMinutes: 23,
      score: 84,
      reasons: ["Compatible blood group", "Eligible", "Available"],
    },
  ],
};

const noCandidateMatching = { candidates: [] };

const allIneligibleMatching = {
  candidates: [
    { donorId: "demo-donor-003", eligible: false, available: true },
    { donorId: "demo-donor-004", eligible: true, available: false },
  ],
};

const lowRisk = { riskScore: 0, riskLevel: "LOW", reasons: [], recommendation: "No immediate action required." };
const highRisk = { riskScore: 60, riskLevel: "HIGH", reasons: ["High volume"], recommendation: "Urgent review." };
const criticalRisk = { riskScore: 80, riskLevel: "CRITICAL", reasons: ["Critical situation"], recommendation: "Immediate intervention." };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AI Manager — coordinate", () => {
  test("valid candidates produce primary donor", () => {
    const result = coordinate({
      requestId: "demo-request-001",
      matchingResult: twoCandidateMatching,
      riskResult: lowRisk,
    });
    assert.strictEqual(result.recommendedDonor, "demo-donor-001");
  });

  test("remaining valid candidates become backups", () => {
    const result = coordinate({
      requestId: "demo-request-001",
      matchingResult: twoCandidateMatching,
      riskResult: lowRisk,
    });
    assert.deepStrictEqual(result.backupDonors, ["demo-donor-002"]);
  });

  test("risk result is preserved", () => {
    const result = coordinate({
      requestId: "demo-request-001",
      matchingResult: twoCandidateMatching,
      riskResult: highRisk,
    });
    assert.strictEqual(result.risk, "HIGH");
    assert.strictEqual(result.riskScore, 60);
  });

  test("request ID is preserved", () => {
    const result = coordinate({
      requestId: "my-request-42",
      matchingResult: twoCandidateMatching,
      riskResult: lowRisk,
    });
    assert.strictEqual(result.requestId, "my-request-42");
  });

  test("nextAction is CONTACT_PRIMARY_DONOR when a candidate exists", () => {
    const result = coordinate({
      requestId: "demo-request-001",
      matchingResult: twoCandidateMatching,
      riskResult: lowRisk,
    });
    assert.strictEqual(result.nextAction, ACTIONS.CONTACT_PRIMARY_DONOR);
  });

  test("no candidates produces EXPAND_SEARCH", () => {
    const result = coordinate({
      requestId: "demo-request-001",
      matchingResult: noCandidateMatching,
      riskResult: lowRisk,
    });
    assert.strictEqual(result.recommendedDonor, null);
    assert.deepStrictEqual(result.backupDonors, []);
    assert.strictEqual(result.nextAction, ACTIONS.EXPAND_SEARCH);
  });

  test("no fake donor is generated", () => {
    const result = coordinate({
      requestId: "demo-request-001",
      matchingResult: noCandidateMatching,
      riskResult: lowRisk,
    });
    assert.strictEqual(result.recommendedDonor, null);
    assert.ok(result.backupDonors.length === 0);
  });

  test("malformed input is handled predictably", () => {
    assert.doesNotThrow(() => {
      const result = coordinate(null);
      assert.strictEqual(result.requestId, null);
      assert.strictEqual(result.nextAction, ACTIONS.MANUAL_REVIEW_REQUIRED);
    });
  });

  test("empty matchingResult is handled", () => {
    const result = coordinate({
      requestId: "demo-request-001",
      matchingResult: {},
      riskResult: lowRisk,
    });
    assert.strictEqual(result.recommendedDonor, null);
    assert.strictEqual(result.nextAction, ACTIONS.EXPAND_SEARCH);
  });

  test("deterministic explanation exists", () => {
    const result = coordinate({
      requestId: "demo-request-001",
      matchingResult: twoCandidateMatching,
      riskResult: lowRisk,
    });
    assert.ok(typeof result.explanation === "string");
    assert.ok(result.explanation.length > 0);
  });

  test("same input gives same result", () => {
    const input = {
      requestId: "demo-request-001",
      matchingResult: twoCandidateMatching,
      riskResult: highRisk,
    };
    const first = coordinate(input);
    const second = coordinate(input);
    assert.deepStrictEqual(first, second);
  });

  test("all ineligible candidates produce NO_ELIGIBLE_CANDIDATES", () => {
    const result = coordinate({
      requestId: "demo-request-001",
      matchingResult: allIneligibleMatching,
      riskResult: lowRisk,
    });
    assert.strictEqual(result.recommendedDonor, null);
    assert.strictEqual(result.nextAction, ACTIONS.NO_ELIGIBLE_CANDIDATES);
  });

  test("critical risk still picks a candidate but returns MANUAL_REVIEW_REQUIRED", () => {
    const result = coordinate({
      requestId: "demo-request-001",
      matchingResult: twoCandidateMatching,
      riskResult: criticalRisk,
    });
    assert.strictEqual(result.recommendedDonor, "demo-donor-001");
    assert.strictEqual(result.nextAction, ACTIONS.MANUAL_REVIEW_REQUIRED);
    assert.strictEqual(result.risk, "CRITICAL");
  });

  test("risk is computed from signals when riskResult not supplied", () => {
    const result = coordinate({
      requestId: "demo-request-001",
      matchingResult: twoCandidateMatching,
      riskSignals: { requestCountRecent: 30, emergencyRequestsRecent: 10 },
    });
    assert.ok(typeof result.risk === "string");
    assert.ok(typeof result.riskScore === "number");
  });

  test("missing requestId returns MANUAL_REVIEW_REQUIRED", () => {
    const result = coordinate({
      matchingResult: twoCandidateMatching,
      riskResult: lowRisk,
    });
    assert.strictEqual(result.nextAction, ACTIONS.MANUAL_REVIEW_REQUIRED);
    assert.strictEqual(result.requestId, null);
  });

  test("explanation includes distance and ETA when available", () => {
    const result = coordinate({
      requestId: "demo-request-001",
      matchingResult: twoCandidateMatching,
      riskResult: lowRisk,
    });
    assert.ok(result.explanation.includes("3.2 km"));
    assert.ok(result.explanation.includes("14 min"));
  });

  test("explanation mentions risk when not LOW", () => {
    const result = coordinate({
      requestId: "demo-request-001",
      matchingResult: twoCandidateMatching,
      riskResult: highRisk,
    });
    assert.ok(result.explanation.includes("HIGH"));
  });

  test("explanation mentions candidate count when multiple", () => {
    const result = coordinate({
      requestId: "demo-request-001",
      matchingResult: twoCandidateMatching,
      riskResult: lowRisk,
    });
    assert.ok(result.explanation.includes("2 viable candidates"));
  });
});

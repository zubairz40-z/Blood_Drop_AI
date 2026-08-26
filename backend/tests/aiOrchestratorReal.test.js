/**
 * Integration tests for the real five-agent orchestration pipeline.
 *
 * Tests coordinateRealRequest() which does DB lookups + real agent calls.
 * Uses mock.method for all dependencies — the orchestrator exports thin DB
 * wrappers (findBloodRequestById, countBloodRequests) specifically so tests
 * can intercept them without fighting Mongoose statics.
 */

const { describe, test, beforeEach, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const REQUEST_ID = "6650f1a2b2c3d4e5f6a7b8c9";

function makeCandidate(donorId, overrides = {}) {
  return {
    donorId,
    bloodGroup: "O+",
    component: "WHOLE_BLOOD",
    eligible: true,
    available: true,
    distanceKm: 2.5,
    etaMinutes: 10,
    score: 90,
    reasons: ["Compatible with O+", "Eligible", "Available", "Nearby"],
    ...overrides,
  };
}

const CANDIDATES = [
  makeCandidate("donor-1", { score: 95, distanceKm: 1.2 }),
  makeCandidate("donor-2", { score: 80, distanceKm: 4.5 }),
  makeCandidate("donor-3", { score: 65, distanceKm: 8.0 }),
];

const MATCHING_RESULT = {
  requestId: REQUEST_ID,
  radiusKm: 25,
  candidates: CANDIDATES,
};

const ELIGIBILITY_RESULT = {
  component: "WHOLE_BLOOD",
  eligibleNow: ["donor-1", "donor-2"],
  eligibleLater: [{ donorId: "donor-3", nextEligibleAt: "2026-09-01T00:00:00Z" }],
  excluded: [],
};

const GEO_RESULT = {
  ordered: ["donor-1", "donor-2", "donor-3"],
  estimated: [
    { donorId: "donor-1", distanceKm: 1.2, etaMinutes: 5 },
    { donorId: "donor-2", distanceKm: 4.5, etaMinutes: 18 },
    { donorId: "donor-3", distanceKm: 8.0, etaMinutes: 32 },
  ],
};

const SELECTION_RESULT = {
  requestId: REQUEST_ID,
  primary: "donor-1",
  backups: ["donor-2", "donor-3"],
  contactOrder: ["donor-1", "donor-2", "donor-3"],
  decisive: true,
  selection: {
    candidates: CANDIDATES,
    topScore: 95,
    secondScore: 80,
    decisive: true,
    margin: 15,
  },
  reason: "donor-1 has score 95 with decisive margin.",
};

const MOCK_DB_REQUEST = {
  _id: REQUEST_ID,
  patient: "patient-1",
  bloodGroup: "O+",
  component: "WHOLE_BLOOD",
  urgency: "URGENT",
  unitsRequired: 2,
  status: "MATCHING",
  location: { type: "Point", coordinates: [90.4125, 23.8103] },
  createdAt: new Date(Date.now() - 3600000),
  save: async function () { return this; },
};

// ---------------------------------------------------------------------------
// Modules under test
// ---------------------------------------------------------------------------

const orchestrator = require("../src/services/aiOrchestrator");
const matchingService = require("../src/services/matchingService");
const donorMatchingAgent = require("../src/agents/donorMatchingAgent");
const eligibilitySchedulingAgent = require("../src/agents/eligibilitySchedulingAgent");
const geoCoordinationAgent = require("../src/agents/geoCoordinationAgent");

// ---------------------------------------------------------------------------
// Mock setup / teardown
// ---------------------------------------------------------------------------

let mocks;

function setupMocks() {
  mocks = [];

  // Mock the orchestrator's DB layer (shared `db` object)
  mocks.push(mock.method(orchestrator.db, "findBloodRequestById", async (id) => {
    if (String(id) === REQUEST_ID) return MOCK_DB_REQUEST;
    return null;
  }));

  mocks.push(mock.method(orchestrator.db, "countBloodRequests", async () => 0));

  // Mock matching service and agents
  mocks.push(mock.method(matchingService, "findCandidates", async () => ({ ...MATCHING_RESULT })));
  mocks.push(mock.method(donorMatchingAgent, "selectDonors", async () => ({ ...SELECTION_RESULT })));
  mocks.push(mock.method(eligibilitySchedulingAgent, "assessDonors", async () => ({ ...ELIGIBILITY_RESULT })));
  mocks.push(mock.method(geoCoordinationAgent, "coordinate", async () => ({ ...GEO_RESULT })));
}

function teardownMocks() {
  for (const m of mocks) {
    m.mock.restore();
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("coordinateRealRequest (real five-agent path)", () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    teardownMocks();
  });

  test("missing requestId returns MANUAL_REVIEW_REQUIRED", async () => {
    const result = await orchestrator.coordinateRealRequest({});
    assert.equal(result.requestId, null);
    assert.equal(result.nextAction, "MANUAL_REVIEW_REQUIRED");
    assert.equal(result.explanation, "Request ID is required.");
  });

  test("null requestId returns MANUAL_REVIEW_REQUIRED", async () => {
    const result = await orchestrator.coordinateRealRequest({ requestId: null });
    assert.equal(result.requestId, null);
    assert.equal(result.nextAction, "MANUAL_REVIEW_REQUIRED");
  });

  test("request not found returns MANUAL_REVIEW_REQUIRED", async () => {
    const result = await orchestrator.coordinateRealRequest({ requestId: "000000000000000000000000" });
    assert.equal(result.requestId, "000000000000000000000000");
    assert.equal(result.nextAction, "MANUAL_REVIEW_REQUIRED");
    assert.equal(result.explanation, "Blood request not found.");
  });

  test("runs matchingService.findCandidates with the request ID", async () => {
    await orchestrator.coordinateRealRequest({ requestId: REQUEST_ID });
    assert.equal(matchingService.findCandidates.mock.callCount(), 1);
    const callArgs = matchingService.findCandidates.mock.calls[0].arguments;
    assert.equal(callArgs[0], REQUEST_ID);
  });

  test("runs donorMatchingAgent.selectDonors with candidateSet", async () => {
    await orchestrator.coordinateRealRequest({ requestId: REQUEST_ID });
    assert.equal(donorMatchingAgent.selectDonors.mock.callCount(), 1);
    const callArgs = donorMatchingAgent.selectDonors.mock.calls[0].arguments;
    assert.equal(callArgs[0], REQUEST_ID);
    assert.deepEqual(callArgs[1].candidateSet, CANDIDATES);
  });

  test("runs eligibilitySchedulingAgent.assessDonors with requestId and options", async () => {
    await orchestrator.coordinateRealRequest({ requestId: REQUEST_ID });
    assert.equal(eligibilitySchedulingAgent.assessDonors.mock.callCount(), 1);
    const callArgs = eligibilitySchedulingAgent.assessDonors.mock.calls[0].arguments;
    assert.equal(callArgs[0], REQUEST_ID);
    assert.ok(Array.isArray(callArgs[1].donorIds), "should pass donorIds in options");
    assert.ok(callArgs[1].candidateSet, "should pass candidateSet in options");
  });

  test("runs geoCoordinationAgent.coordinate with requestId and options", async () => {
    await orchestrator.coordinateRealRequest({ requestId: REQUEST_ID });
    assert.equal(geoCoordinationAgent.coordinate.mock.callCount(), 1);
    const callArgs = geoCoordinationAgent.coordinate.mock.calls[0].arguments;
    assert.equal(callArgs[0], REQUEST_ID);
    assert.ok(callArgs[1].candidateSet, "should pass candidateSet in options");
  });

  test("returns recommendedDonor from aiManager", async () => {
    const result = await orchestrator.coordinateRealRequest({ requestId: REQUEST_ID });
    assert.equal(result.recommendedDonor, "donor-1");
    assert.equal(result.nextAction, "CONTACT_PRIMARY_DONOR");
  });

  test("backup donors list excludes the primary", async () => {
    const result = await orchestrator.coordinateRealRequest({ requestId: REQUEST_ID });
    assert.ok(!result.backupDonors.includes("donor-1"), "primary should not be in backups");
    assert.deepEqual(result.backupDonors, ["donor-2", "donor-3"]);
  });

  test("risk is computed from real DB signals", async () => {
    const result = await orchestrator.coordinateRealRequest({ requestId: REQUEST_ID });
    assert.equal(typeof result.riskScore, "number");
    assert.ok(["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(result.risk));
  });

  test("eligibilityResult attached to output", async () => {
    const result = await orchestrator.coordinateRealRequest({ requestId: REQUEST_ID });
    assert.ok(result.eligibilityResult, "eligibilityResult should be present");
    assert.deepEqual(result.eligibilityResult.eligibleNow, ["donor-1", "donor-2"]);
  });

  test("geoResult attached to output", async () => {
    const result = await orchestrator.coordinateRealRequest({ requestId: REQUEST_ID });
    assert.ok(result.geoResult, "geoResult should be present");
    assert.deepEqual(result.geoResult.ordered, ["donor-1", "donor-2", "donor-3"]);
  });

  test("selection (donor matching agent output) attached to output", async () => {
    const result = await orchestrator.coordinateRealRequest({ requestId: REQUEST_ID });
    assert.ok(result.selection, "selection should be present");
    assert.equal(result.selection.primary, "donor-1");
    assert.ok(result.selection.decisive);
  });

  test("agentStatus reports COMPLETED for all agents", async () => {
    const result = await orchestrator.coordinateRealRequest({ requestId: REQUEST_ID });
    assert.ok(result.agentStatus, "agentStatus should be present");
    assert.equal(result.agentStatus.matching, "COMPLETED");
    assert.equal(result.agentStatus.eligibility, "COMPLETED");
    assert.equal(result.agentStatus.geo, "COMPLETED");
    assert.equal(result.agentStatus.risk, "COMPLETED");
  });

  test("requestInfo attached to output with request metadata", async () => {
    const result = await orchestrator.coordinateRealRequest({ requestId: REQUEST_ID });
    assert.ok(result.requestInfo, "requestInfo should be present");
    assert.equal(result.requestInfo.bloodGroup, "O+");
    assert.equal(result.requestInfo.component, "WHOLE_BLOOD");
    assert.equal(result.requestInfo.urgency, "URGENT");
    assert.equal(result.requestInfo.unitsRequired, 2);
    assert.equal(result.requestInfo.status, "MATCHING");
  });

  test("result contract has all required fields", async () => {
    const result = await orchestrator.coordinateRealRequest({ requestId: REQUEST_ID });
    assert.equal(typeof result.requestId, "string");
    assert.equal(typeof result.risk, "string");
    assert.equal(typeof result.riskScore, "number");
    assert.ok(
      result.recommendedDonor === null || typeof result.recommendedDonor === "string"
    );
    assert.ok(Array.isArray(result.backupDonors));
    assert.equal(typeof result.nextAction, "string");
    assert.equal(typeof result.explanation, "string");
  });

  test("all three Arefa agents called exactly once", async () => {
    await orchestrator.coordinateRealRequest({ requestId: REQUEST_ID });
    assert.equal(donorMatchingAgent.selectDonors.mock.callCount(), 1);
    assert.equal(eligibilitySchedulingAgent.assessDonors.mock.callCount(), 1);
    assert.equal(geoCoordinationAgent.coordinate.mock.callCount(), 1);
  });

  test("gracefully handles eligibility agent error", async () => {
    eligibilitySchedulingAgent.assessDonors.mock.restore();
    mocks.push(mock.method(eligibilitySchedulingAgent, "assessDonors", async () => {
      throw new Error("Eligibility service unavailable");
    }));

    const result = await orchestrator.coordinateRealRequest({ requestId: REQUEST_ID });
    assert.equal(result.agentStatus.eligibility, "ERROR");
    assert.equal(result.eligibilityResult.error, "Eligibility assessment failed.");
    assert.equal(result.agentStatus.matching, "COMPLETED");
    assert.equal(result.agentStatus.geo, "COMPLETED");
    assert.equal(result.recommendedDonor, "donor-1");
  });

  test("gracefully handles geo agent error", async () => {
    geoCoordinationAgent.coordinate.mock.restore();
    mocks.push(mock.method(geoCoordinationAgent, "coordinate", async () => {
      throw new Error("Geo service unavailable");
    }));

    const result = await orchestrator.coordinateRealRequest({ requestId: REQUEST_ID });
    assert.equal(result.agentStatus.geo, "ERROR");
    assert.equal(result.geoResult.error, "Geo coordination failed.");
    assert.equal(result.agentStatus.matching, "COMPLETED");
    assert.equal(result.recommendedDonor, "donor-1");
  });

  test("gracefully handles donor matching agent error", async () => {
    donorMatchingAgent.selectDonors.mock.restore();
    mocks.push(mock.method(donorMatchingAgent, "selectDonors", async () => {
      throw new Error("Matching selection failed");
    }));

    const result = await orchestrator.coordinateRealRequest({ requestId: REQUEST_ID });
    assert.equal(result.agentStatus.matching, "ERROR");
    assert.equal(result.selection.error, "Donor matching failed.");
    assert.equal(result.recommendedDonor, "donor-1");
  });

  test("no candidates from matchingService returns EXPAND_SEARCH", async () => {
    matchingService.findCandidates.mock.restore();
    mocks.push(mock.method(matchingService, "findCandidates", async () => ({
      requestId: REQUEST_ID,
      candidates: [],
    })));

    const result = await orchestrator.coordinateRealRequest({ requestId: REQUEST_ID });
    assert.equal(result.recommendedDonor, null);
    assert.equal(result.nextAction, "EXPAND_SEARCH");
    assert.equal(donorMatchingAgent.selectDonors.mock.callCount(), 1);
    assert.equal(eligibilitySchedulingAgent.assessDonors.mock.callCount(), 1);
    assert.equal(geoCoordinationAgent.coordinate.mock.callCount(), 1);
  });
});

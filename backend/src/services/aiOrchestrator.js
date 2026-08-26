/**
 * AI Orchestrator — the reusable coordination workflow.
 *
 * Two entry points:
 *   coordinateRequest()    — pure, client-injected inputs (backward compat / tests)
 *   coordinateRealRequest() — async, DB lookup + real Arefa agents server-side
 *
 * The real path runs all 5 agents in-process with one shared candidate set:
 *   1. matchingService.findCandidates()   (pre-filter, score, rank)
 *   2. donorMatchingAgent.selectDonors()   (primary + backups, decisiveness)
 *   3. eligibilitySchedulingAgent.assessDonors() (per-donor eligibility detail)
 *   4. geoCoordinationAgent.coordinate()   (distance-sorted ranking)
 *   5. riskAdvisorAgent.analyzeRisk()      (operational risk signals)
 *   6. aiManager.coordinate()              (final recommendation)
 */

const BloodRequest = require("../models/BloodRequest");
const riskAdvisorAgent = require("../agents/riskAdvisorAgent");
const aiManager = require("../agents/aiManager");
const matchingService = require("./matchingService");
const donorMatchingAgent = require("../agents/donorMatchingAgent");
const eligibilitySchedulingAgent = require("../agents/eligibilitySchedulingAgent");
const geoCoordinationAgent = require("../agents/geoCoordinationAgent");

// ---------------------------------------------------------------------------
// DB wrappers — thin functions that wrap Mongoose statics.
// Placed on a shared `db` object so that mock.method in tests can intercept
// them. Both internal code and exports reference the same object, so the
// replacement is visible to the closure at call time.
// ---------------------------------------------------------------------------

const db = {
  /** Look up a blood request by ID. */
  findBloodRequestById: async (id) => BloodRequest.findById(id),

  /** Count documents matching a filter. */
  countBloodRequests: async (filter) => BloodRequest.countDocuments(filter),
};

// ---------------------------------------------------------------------------
// Input defaults (for the injected-input path)
// ---------------------------------------------------------------------------

const EMPTY_RISK_CONTEXT = {
  requestCountRecent: 0,
  emergencyRequestsRecent: 0,
  cancelledRequestsRecent: 0,
  donorActivityCount: 0,
  emergencyResponseMinutes: 0,
  bloodGroupDemandCount: 0,
};

// ---------------------------------------------------------------------------
// Legacy entry point — client-injected inputs (tests and backward compat)
// ---------------------------------------------------------------------------

/**
 * Orchestrates the current AI workflow for a single blood request.
 * Inputs are injected by the caller — no DB, no agent calls.
 *
 * @param {object} input
 * @param {object} input.request          — the blood request (must have an id)
 * @param {object} [input.matchingResult]  — donor matching agent output
 * @param {object} [input.eligibilityResult] — eligibility agent output
 * @param {object} [input.geoResult]       — geo coordination agent output
 * @param {object} [input.riskContext]      — raw signals for risk advisor
 * @returns {object} final coordination result
 */
function coordinateRequest(input) {
  const {
    request = null,
    matchingResult = null,
    eligibilityResult = null,
    geoResult = null,
    riskContext = null,
  } = input || {};

  // --- 1. Validate the request has an id ---
  if (!request || typeof request !== "object") {
    return {
      requestId: null,
      risk: "LOW",
      riskScore: 0,
      recommendedDonor: null,
      backupDonors: [],
      nextAction: "MANUAL_REVIEW_REQUIRED",
      explanation: "Request is missing or malformed.",
    };
  }

  if (!request.id) {
    return {
      requestId: null,
      risk: "LOW",
      riskScore: 0,
      recommendedDonor: null,
      backupDonors: [],
      nextAction: "MANUAL_REVIEW_REQUIRED",
      explanation: "Request is missing or malformed.",
    };
  }

  // --- 2. Run Risk & Advisor Agent ---
  const riskInput = riskContext || EMPTY_RISK_CONTEXT;
  const riskResult = riskAdvisorAgent.analyzeRisk(riskInput);

  // --- 3. Pass all outputs into AI Manager ---
  const result = aiManager.coordinate({
    requestId: request.id,
    matchingResult,
    riskResult,
  });

  // Enrich with eligibility and geo metadata for downstream use
  // (not consumed by AI Manager yet, but preserved in the result contract)
  if (eligibilityResult) {
    result.eligibilityResult = eligibilityResult;
  }
  if (geoResult) {
    result.geoResult = geoResult;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Risk context builder — queries DB for real operational signals
// ---------------------------------------------------------------------------

/**
 * Computes risk signals from real database state for the given request.
 *
 * Queries (all read-only, all bounded):
 *   - recentRequests: total non-terminal requests in last 7 days
 *   - emergencyRequests: emergency requests in last 7 days
 *   - cancelledRequests: cancelled requests from the same patient in last 7 days
 *   - bloodGroupDemand: requests for the same blood group in last 7 days
 *   - emergencyResponseMinutes: time since this request was created (if emergency)
 *
 * @param {object} request — a Mongoose BloodRequest document
 * @returns {object} riskContext in the shape analyzeRisk() expects
 */
async function buildRiskContext(request) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [recentRequests, emergencyRequests, cancelledRequests, bloodGroupDemand] =
    await Promise.all([
      db.countBloodRequests({
        createdAt: { $gte: sevenDaysAgo },
        status: { $nin: ["CANCELLED", "EXPIRED", "REJECTED"] },
      }),
      db.countBloodRequests({
        urgency: "EMERGENCY",
        createdAt: { $gte: sevenDaysAgo },
        status: { $nin: ["CANCELLED", "EXPIRED", "REJECTED"] },
      }),
      db.countBloodRequests({
        patient: request.patient,
        status: "CANCELLED",
        createdAt: { $gte: sevenDaysAgo },
      }),
      db.countBloodRequests({
        bloodGroup: request.bloodGroup,
        createdAt: { $gte: sevenDaysAgo },
        status: { $nin: ["CANCELLED", "EXPIRED", "REJECTED"] },
      }),
    ]);

  // For emergency requests, measure how long since it was filed
  let emergencyResponseMinutes = 0;
  if (request.urgency === "EMERGENCY" && request.createdAt) {
    emergencyResponseMinutes = Math.round(
      (now.getTime() - new Date(request.createdAt).getTime()) / 60000
    );
  }

  return {
    requestCountRecent: recentRequests,
    emergencyRequestsRecent: emergencyRequests,
    cancelledRequestsRecent: cancelledRequests,
    donorActivityCount: 0, // Would require DonorProfile query; kept 0 for now
    emergencyResponseMinutes,
    bloodGroupDemandCount: bloodGroupDemand,
  };
}

// ---------------------------------------------------------------------------
// Real entry point — DB lookup + all 5 agents server-side
// ---------------------------------------------------------------------------

/**
 * Orchestrates the full five-agent workflow for a single blood request.
 *
 * Looks up the request from the database, runs the matching service to get
 * candidates, then executes all three Arefa agents in parallel on the same
 * candidate set.  Builds risk context from real DB signals, runs the Risk
 * & Advisor Agent, and finally calls the AI Manager for the recommendation.
 *
 * @param {object} params
 * @param {string} params.requestId — MongoDB ObjectId string of the blood request
 * @returns {object} full coordination result with agentStatus metadata
 */
async function coordinateRealRequest({ requestId }) {
  if (!requestId) {
    return {
      requestId: null,
      risk: "LOW",
      riskScore: 0,
      recommendedDonor: null,
      backupDonors: [],
      nextAction: "MANUAL_REVIEW_REQUIRED",
      explanation: "Request ID is required.",
      agentStatus: {},
    };
  }

  // 1. Look up the BloodRequest
  const request = await db.findBloodRequestById(requestId);
  if (!request) {
    return {
      requestId: String(requestId),
      risk: "LOW",
      riskScore: 0,
      recommendedDonor: null,
      backupDonors: [],
      nextAction: "MANUAL_REVIEW_REQUIRED",
      explanation: "Blood request not found.",
      agentStatus: {},
    };
  }

  // 2. Run matching service to get scored, ranked candidates
  //    findCandidates already filters for eligibility and availability.
  const matchingResult = await matchingService.findCandidates(requestId, { limit: 20 });
  const candidates = matchingResult.candidates || [];
  const donorIds = candidates.map((c) => c.donorId);

  // 3. Run all three Arefa agents in parallel
  //    All share the same candidateSet to avoid redundant queries.
  const agentStatus = {};

  let [eligibilityResult, geoResult, selection] = await Promise.all([
    eligibilitySchedulingAgent.assessDonors(requestId, {
      donorIds,
      candidateSet: matchingResult,
      asOf: new Date(),
    }).then((r) => {
      agentStatus.eligibility = "COMPLETED";
      return r;
    }).catch((err) => {
      agentStatus.eligibility = "ERROR";
      return { component: request.component, eligibleNow: [], eligibleLater: [], excluded: [], error: "Eligibility assessment failed." };
    }),
    geoCoordinationAgent.coordinate(requestId, {
      candidateSet: matchingResult,
      neededBy: request.neededBy,
      asOf: new Date(),
    }).then((r) => {
      agentStatus.geo = "COMPLETED";
      return r;
    }).catch((err) => {
      agentStatus.geo = "ERROR";
      return { ordered: [], estimated: [], error: "Geo coordination failed." };
    }),
    donorMatchingAgent.selectDonors(requestId, { candidateSet: candidates }).then((r) => {
      agentStatus.matching = "COMPLETED";
      return r;
    }).catch((err) => {
      agentStatus.matching = "ERROR";
      return { requestId, primary: null, backups: [], selection: { candidates }, error: "Donor matching failed." };
    }),
  ]);

  // 4. Build risk context from real DB signals
  const riskContext = await buildRiskContext(request);
  const riskResult = riskAdvisorAgent.analyzeRisk(riskContext);
  agentStatus.risk = "COMPLETED";

  // 5. Feed all outputs into AI Manager
  //    The AI Manager uses matchingResult.candidates for its viability checks.
  const result = aiManager.coordinate({
    requestId: String(request._id),
    matchingResult,
    riskResult,
  });

  // 6. Attach all agent outputs for frontend display
  result.eligibilityResult = eligibilityResult;
  result.geoResult = geoResult;
  result.selection = selection;
  result.agentStatus = agentStatus;
  result.requestInfo = {
    bloodGroup: request.bloodGroup,
    component: request.component,
    urgency: request.urgency,
    unitsRequired: request.unitsRequired,
    status: request.status,
  };

  return result;
}

module.exports = {
  coordinateRequest,
  coordinateRealRequest,
  buildRiskContext,
  db,
};

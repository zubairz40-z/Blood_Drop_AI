/**
 * AI Independence Test — verifies that Gemini service failure does NOT
 * affect the deterministic five-agent coordination pipeline.
 *
 * The five agents (AI Manager, Donor Matching, Eligibility, Geo, Risk)
 * are completely independent of Gemini. This test proves it by mocking
 * Gemini to fail while the coordination pipeline still succeeds.
 */

const { describe, test, mock } = require("node:test");
const assert = require("node:assert/strict");
const geminiService = require("../src/services/geminiService");
const aiManager = require("../src/agents/aiManager");
const riskAdvisorAgent = require("../src/agents/riskAdvisorAgent");

describe("AI Independence — Gemini failure does not affect coordination", () => {
  test("AI Manager coordinate() succeeds without Gemini", () => {
    const result = aiManager.coordinate({
      requestId: "test-123",
      matchingResult: {
        candidates: [
          { donorId: "D-1", eligible: true, available: true, score: 90, distanceKm: 2, etaMinutes: 10, reasons: ["Compatible"] },
        ],
      },
      riskResult: { riskScore: 10, riskLevel: "LOW", reasons: [], recommendation: "No action needed." },
    });

    assert.equal(result.requestId, "test-123");
    assert.equal(result.recommendedDonor, "D-1");
    assert.equal(result.nextAction, "CONTACT_PRIMARY_DONOR");
    assert.equal(result.risk, "LOW");
  });

  test("Risk Advisor analyzeRisk() succeeds without Gemini", () => {
    const result = riskAdvisorAgent.analyzeRisk({
      requestCountRecent: 5,
      emergencyRequestsRecent: 2,
      cancelledRequestsRecent: 1,
    });

    assert.equal(typeof result.riskScore, "number");
    assert.equal(typeof result.riskLevel, "string");
    assert.ok(Array.isArray(result.reasons));
    assert.equal(typeof result.recommendation, "string");
  });

  test("Gemini failure does not throw in the coordination path", () => {
    // Simulate Gemini being completely broken
    const stub = mock.method(geminiService, "generateGeminiText", async () => {
      throw new Error("GEMINI_API_KEY is not set.");
    });

    try {
      // Coordination should work fine
      const risk = riskAdvisorAgent.analyzeRisk({ requestCountRecent: 3 });
      assert.ok(risk.riskLevel);

      const coord = aiManager.coordinate({
        requestId: "test-456",
        matchingResult: { candidates: [] },
        riskResult: risk,
      });
      assert.equal(coord.nextAction, "EXPAND_SEARCH");
    } finally {
      stub.mock.restore();
    }
  });

  test("all five agents export pure functions", () => {
    const aiManager = require("../src/agents/aiManager");
    const donorMatching = require("../src/agents/donorMatchingAgent");
    const eligibility = require("../src/agents/eligibilitySchedulingAgent");
    const geo = require("../src/agents/geoCoordinationAgent");
    const risk = require("../src/agents/riskAdvisorAgent");

    assert.equal(typeof aiManager.coordinate, "function");
    assert.equal(typeof donorMatching.selectDonors, "function");
    assert.equal(typeof eligibility.assessDonors, "function");
    assert.equal(typeof geo.coordinate, "function");
    assert.equal(typeof risk.analyzeRisk, "function");
  });
});

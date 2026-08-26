const { test, describe } = require("node:test");
const assert = require("node:assert");
const { analyzeRisk } = require("../src/agents/riskAdvisorAgent");

describe("analyzeRisk", () => {
  test("normal activity returns LOW risk", () => {
    const result = analyzeRisk({
      requestCountRecent: 2,
      emergencyRequestsRecent: 0,
      cancelledRequestsRecent: 0,
      donorActivityCount: 5,
      emergencyResponseMinutes: 10,
      bloodGroupDemandCount: 3,
    });
    assert.strictEqual(result.riskLevel, "LOW");
    assert.strictEqual(result.riskScore, 0);
    assert.ok(Array.isArray(result.reasons));
    assert.strictEqual(result.reasons.length, 0);
    assert.ok(typeof result.recommendation === "string");
  });

  test("suspicious request volume raises score", () => {
    const result = analyzeRisk({
      requestCountRecent: 25,
    });
    assert.ok(result.riskScore > 0);
    assert.ok(result.reasons.length > 0);
    assert.ok(result.reasons.some((r) => r.includes("repeated") || r.includes("Repeated")));
  });

  test("repeated cancellation raises score", () => {
    const result = analyzeRisk({
      cancelledRequestsRecent: 10,
    });
    assert.ok(result.riskScore > 0);
    assert.ok(result.reasons.some((r) => r.includes("cancelled")));
  });

  test("long emergency response raises score", () => {
    const result = analyzeRisk({
      emergencyResponseMinutes: 90,
    });
    assert.ok(result.riskScore > 0);
    assert.ok(result.reasons.some((r) => r.includes("response time")));
  });

  test("multiple risk signals combine additively", () => {
    const result = analyzeRisk({
      requestCountRecent: 30,
      cancelledRequestsRecent: 10,
      emergencyResponseMinutes: 100,
    });
    // Three signals: 20 + 15 + 20 = 55
    assert.strictEqual(result.riskScore, 55);
    assert.strictEqual(result.riskLevel, "HIGH");
    assert.strictEqual(result.reasons.length, 3);
  });

  test("score never exceeds 100", () => {
    const result = analyzeRisk({
      requestCountRecent: 100,
      emergencyRequestsRecent: 100,
      cancelledRequestsRecent: 100,
      donorActivityCount: 100,
      emergencyResponseMinutes: 9999,
      bloodGroupDemandCount: 100,
    });
    assert.ok(result.riskScore <= 100);
  });

  test("missing values do not crash", () => {
    assert.doesNotThrow(() => {
      const result = analyzeRisk({});
      assert.strictEqual(result.riskScore, 0);
      assert.strictEqual(result.riskLevel, "LOW");
    });
  });

  test("negative numeric values are handled safely", () => {
    const result = analyzeRisk({
      requestCountRecent: -5,
      emergencyRequestsRecent: -10,
      cancelledRequestsRecent: -1,
      donorActivityCount: -3,
      emergencyResponseMinutes: -20,
      bloodGroupDemandCount: -2,
    });
    assert.strictEqual(result.riskScore, 0);
    assert.strictEqual(result.riskLevel, "LOW");
  });

  test("non-numeric values are treated as zero", () => {
    const result = analyzeRisk({
      requestCountRecent: "abc",
      emergencyRequestsRecent: null,
      cancelledRequestsRecent: undefined,
      donorActivityCount: NaN,
    });
    assert.strictEqual(result.riskScore, 0);
    assert.strictEqual(result.riskLevel, "LOW");
  });

  test("same input always produces same output", () => {
    const input = {
      requestCountRecent: 25,
      emergencyRequestsRecent: 7,
      cancelledRequestsRecent: 8,
      donorActivityCount: 35,
      emergencyResponseMinutes: 75,
      bloodGroupDemandCount: 12,
    };
    const first = analyzeRisk(input);
    const second = analyzeRisk(input);
    assert.deepStrictEqual(first, second);
  });

  test("output contains all required fields", () => {
    const result = analyzeRisk({ requestCountRecent: 25 });
    assert.ok("riskScore" in result);
    assert.ok("riskLevel" in result);
    assert.ok("reasons" in result);
    assert.ok("recommendation" in result);
  });

  test("HIGH emergency volume raises score", () => {
    const result = analyzeRisk({ emergencyRequestsRecent: 10 });
    assert.ok(result.riskScore > 0);
    assert.ok(result.reasons.some((r) => r.includes("emergency")));
  });

  test("high donor activity raises score", () => {
    const result = analyzeRisk({ donorActivityCount: 40 });
    assert.ok(result.riskScore > 0);
    assert.ok(result.reasons.some((r) => r.includes("donor activity")));
  });

  test("high blood group demand raises score", () => {
    const result = analyzeRisk({ bloodGroupDemandCount: 15 });
    assert.ok(result.riskScore > 0);
    assert.ok(result.reasons.some((r) => r.includes("blood group")));
  });

  test("CRITICAL level is reached with enough signals", () => {
    const result = analyzeRisk({
      requestCountRecent: 30,
      emergencyRequestsRecent: 10,
      cancelledRequestsRecent: 10,
      emergencyResponseMinutes: 100,
    });
    assert.strictEqual(result.riskLevel, "CRITICAL");
    assert.ok(result.riskScore >= 75);
  });

  test("MEDIUM level works correctly", () => {
    const result = analyzeRisk({
      requestCountRecent: 25,
      emergencyRequestsRecent: 7,
    });
    // 20 + 25 = 45
    assert.strictEqual(result.riskScore, 45);
    assert.strictEqual(result.riskLevel, "MEDIUM");
  });
});

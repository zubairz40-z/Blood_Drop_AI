/**
 * Tests for admin analytics service, health declarations, and donation interval config.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

describe("AdminAnalyticsService", () => {
  it("exports getAnalytics function", () => {
    const svc = require("../src/services/adminAnalyticsService");
    assert.equal(typeof svc.getAnalytics, "function");
  });

  it("analytics controller exists and exports getAdminAnalytics", () => {
    const ctrl = require("../src/controllers/adminAnalyticsController");
    assert.equal(typeof ctrl.getAdminAnalytics, "function");
  });
});

describe("HealthDeclaration Model", () => {
  it("has append-only schema fields", () => {
    const HD = require("../src/models/HealthDeclaration");
    const schema = HD.schema.paths;
    assert.ok(schema.donor, "should have donor field");
    assert.ok(schema.answers, "should have answers field");
    assert.ok(schema.source, "should have source field");
    assert.ok(schema.status, "should have status field");
    assert.ok(schema.declaredAt, "should have declaredAt field");
  });

  it("source enum includes self, hospital, admin", () => {
    const HD = require("../src/models/HealthDeclaration");
    const sourceEnum = HD.schema.paths.source.enumValues;
    assert.ok(sourceEnum.includes("self"));
    assert.ok(sourceEnum.includes("hospital"));
    assert.ok(sourceEnum.includes("admin"));
  });
});

describe("DonationIntervalConfig Model", () => {
  it("exports COMPONENT_CODES", () => {
    const { COMPONENT_CODES } = require("../src/models/DonationIntervalConfig");
    assert.ok(Array.isArray(COMPONENT_CODES));
    assert.ok(COMPONENT_CODES.includes("WHOLE_BLOOD"));
    assert.ok(COMPONENT_CODES.includes("PLASMA"));
    assert.ok(COMPONENT_CODES.includes("PLATELETS"));
    assert.ok(COMPONENT_CODES.includes("DOUBLE_RED_CELLS"));
  });

  it("schema has component, intervalDays, active fields", () => {
    const DIC = require("../src/models/DonationIntervalConfig");
    const schema = DIC.schema.paths;
    assert.ok(schema.component, "should have component field");
    assert.ok(schema.intervalDays, "should have intervalDays field");
    assert.ok(schema.active, "should have active field");
  });
});

describe("EligibilityReminderService", () => {
  it("exports checkEligibilityReminders function", () => {
    const svc = require("../src/services/eligibilityReminderService");
    assert.equal(typeof svc.checkEligibilityReminders, "function");
  });
});

describe("Payment Routes", () => {
  it("payment routes file exists and can be required", () => {
    const routes = require("../src/routes/paymentRoutes");
    assert.ok(routes, "payment routes should be importable");
  });
});

describe("App.js new routes", () => {
  it("app.js loads without errors", () => {
    const app = require("../src/app");
    assert.ok(app, "app should be importable");
  });
});

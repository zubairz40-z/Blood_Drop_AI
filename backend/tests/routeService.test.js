/**
 * Tests for the road routing service.
 * OSRM calls are made to the public demo server; fallback is Haversine.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

describe("RouteService", () => {
  it("exports getRoute and fallbackRoute", () => {
    const svc = require("../src/services/routeService");
    assert.equal(typeof svc.getRoute, "function");
    assert.equal(typeof svc.fallbackRoute, "function");
  });

  it("fallbackRoute returns Haversine distance", () => {
    const svc = require("../src/services/routeService");
    // Dhaka to Chattogram ~250km as the crow flies
    const result = svc.fallbackRoute([90.41, 23.81], [91.83, 22.35]);
    assert.ok(result.distanceKm > 150 && result.distanceKm < 350, "distance should be roughly 250km, got " + result.distanceKm);
    assert.ok(result.durationMinutes > 0, "duration should be positive");
    assert.equal(result.routeAvailable, false);
    assert.equal(result.provider, "haversine");
  });

  it("fallbackRoute returns 0 for missing coordinates", () => {
    const svc = require("../src/services/routeService");
    const result = svc.fallbackRoute(null, [90.41, 23.81]);
    assert.equal(result.distanceKm, 0);
    assert.equal(result.routeAvailable, false);
  });

  it("getRoute returns a result for valid coordinates", async () => {
    const svc = require("../src/services/routeService");
    const result = await svc.getRoute([90.41, 23.81], [90.38, 23.75]);
    assert.ok(result, "should return a result");
    assert.ok(typeof result.distanceKm === "number", "distanceKm should be a number");
    assert.ok(typeof result.durationMinutes === "number", "durationMinutes should be a number");
    assert.ok(typeof result.routeAvailable === "boolean", "routeAvailable should be boolean");
  });

  it("getRoute falls back to Haversine for invalid coordinates", async () => {
    const svc = require("../src/services/routeService");
    const result = await svc.getRoute("invalid", "invalid");
    assert.equal(result.routeAvailable, false);
    assert.equal(result.provider, "haversine");
  });
});

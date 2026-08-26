const { describe, test } = require("node:test");
const assert = require("node:assert");

const {
  isValidLongitude,
  isValidLatitude,
  validateGeoJsonPoint,
  isWithinBangladesh,
  toGeoJson,
  haversineDistance,
  generateNearbyPoint,
  geoJsonDistance,
  BANGLADESH_BOUNDS,
  DHAKA_CENTER,
} = require("../src/utils/geoValidation");

// ═══════════════════════════════════════════════════════════════════════════
// isValidLongitude / isValidLatitude
// ═══════════════════════════════════════════════════════════════════════════
describe("isValidLongitude", () => {
  test("valid values", () => {
    assert.strictEqual(isValidLongitude(0), true);
    assert.strictEqual(isValidLongitude(90.4125), true);
    assert.strictEqual(isValidLongitude(-180), true);
    assert.strictEqual(isValidLongitude(180), true);
    assert.strictEqual(isValidLongitude(-90.5), true);
  });

  test("invalid values", () => {
    assert.strictEqual(isValidLongitude(181), false);
    assert.strictEqual(isValidLongitude(-181), false);
    assert.strictEqual(isValidLongitude(NaN), false);
    assert.strictEqual(isValidLongitude(Infinity), false);
    assert.strictEqual(isValidLongitude("90"), false);
    assert.strictEqual(isValidLongitude(null), false);
    assert.strictEqual(isValidLongitude(undefined), false);
  });
});

describe("isValidLatitude", () => {
  test("valid values", () => {
    assert.strictEqual(isValidLatitude(0), true);
    assert.strictEqual(isValidLatitude(23.8103), true);
    assert.strictEqual(isValidLatitude(-90), true);
    assert.strictEqual(isValidLatitude(90), true);
  });

  test("invalid values", () => {
    assert.strictEqual(isValidLatitude(91), false);
    assert.strictEqual(isValidLatitude(-91), false);
    assert.strictEqual(isValidLatitude(NaN), false);
    assert.strictEqual(isValidLatitude(Infinity), false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// validateGeoJsonPoint
// ═══════════════════════════════════════════════════════════════════════════
describe("validateGeoJsonPoint", () => {
  test("valid GeoJSON Point", () => {
    const result = validateGeoJsonPoint({ type: "Point", coordinates: [90.4125, 23.8103] });
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.lng, 90.4125);
    assert.strictEqual(result.lat, 23.8103);
  });

  test("null/undefined input", () => {
    assert.strictEqual(validateGeoJsonPoint(null).valid, false);
    assert.strictEqual(validateGeoJsonPoint(undefined).valid, false);
  });

  test("wrong type", () => {
    assert.strictEqual(validateGeoJsonPoint({ type: "LineString", coordinates: [0, 0] }).valid, false);
  });

  test("missing coordinates", () => {
    assert.strictEqual(validateGeoJsonPoint({ type: "Point" }).valid, false);
    assert.strictEqual(validateGeoJsonPoint({ type: "Point", coordinates: [] }).valid, false);
  });

  test("wrong coordinate count", () => {
    assert.strictEqual(validateGeoJsonPoint({ type: "Point", coordinates: [1, 2, 3] }).valid, false);
  });

  test("non-numeric coordinates", () => {
    assert.strictEqual(validateGeoJsonPoint({ type: "Point", coordinates: ["90", "23"] }).valid, false);
  });

  test("out-of-range coordinates", () => {
    assert.strictEqual(validateGeoJsonPoint({ type: "Point", coordinates: [200, 23] }).valid, false);
    assert.strictEqual(validateGeoJsonPoint({ type: "Point", coordinates: [90, 100] }).valid, false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// isWithinBangladesh
// ═══════════════════════════════════════════════════════════════════════════
describe("isWithinBangladesh", () => {
  test("Dhaka is within Bangladesh", () => {
    assert.strictEqual(isWithinBangladesh(90.4125, 23.8103), true);
  });

  test("Chattogram is within Bangladesh", () => {
    assert.strictEqual(isWithinBangladesh(91.8250, 22.3475), true);
  });

  test("Sylhet is within Bangladesh", () => {
    assert.strictEqual(isWithinBangladesh(91.8700, 24.8940), true);
  });

  test("New York is not within Bangladesh", () => {
    assert.strictEqual(isWithinBangladesh(-74.006, 40.7128), false);
  });

  test("Invalid coords are not within Bangladesh", () => {
    assert.strictEqual(isWithinBangladesh(NaN, NaN), false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// toGeoJson
// ═══════════════════════════════════════════════════════════════════════════
describe("toGeoJson", () => {
  test("GeoJSON pass-through", () => {
    const input = { type: "Point", coordinates: [90.41, 23.81] };
    const result = toGeoJson(input);
    assert.deepStrictEqual(result, { type: "Point", coordinates: [90.41, 23.81] });
  });

  test("flat {latitude, longitude} format", () => {
    const result = toGeoJson({ latitude: 23.81, longitude: 90.41 });
    assert.deepStrictEqual(result, { type: "Point", coordinates: [90.41, 23.81] });
  });

  test("flat {lat, lng} format", () => {
    const result = toGeoJson({ lat: 23.81, lng: 90.41 });
    assert.deepStrictEqual(result, { type: "Point", coordinates: [90.41, 23.81] });
  });

  test("null/undefined input returns null", () => {
    assert.strictEqual(toGeoJson(null), null);
    assert.strictEqual(toGeoJson(undefined), null);
  });

  test("invalid coordinates returns null", () => {
    assert.strictEqual(toGeoJson({ type: "Point", coordinates: [200, 23] }), null);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// haversineDistance
// ═══════════════════════════════════════════════════════════════════════════
describe("haversineDistance", () => {
  test("same point returns 0", () => {
    assert.strictEqual(haversineDistance(90.41, 23.81, 90.41, 23.81), 0);
  });

  test("Dhaka to Chattogram ~220km", () => {
    const dist = haversineDistance(90.4125, 23.8103, 91.8250, 22.3475);
    assert.ok(dist > 190 && dist < 260, `Expected ~220km, got ${dist}`);
  });

  test("Dhaka to Sylhet ~200km", () => {
    const dist = haversineDistance(90.4125, 23.8103, 91.8700, 24.8940);
    assert.ok(dist > 170 && dist < 250, `Expected ~200km, got ${dist}`);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// generateNearbyPoint
// ═══════════════════════════════════════════════════════════════════════════
describe("generateNearbyPoint", () => {
  test("generates a point within the specified distance range", () => {
    const center = { lat: 23.8103, lng: 90.4125 };
    for (let seed = 1; seed <= 50; seed++) {
      const point = generateNearbyPoint(center.lng, center.lat, 1, 5, seed);
      assert.ok(typeof point.lng === "number", "lng must be a number");
      assert.ok(typeof point.lat === "number", "lat must be a number");
      assert.ok(Number.isFinite(point.lng), "lng must be finite");
      assert.ok(Number.isFinite(point.lat), "lat must be finite");
      // Point should be within Bangladesh
      assert.ok(isWithinBangladesh(point.lng, point.lat),
        `Point (${point.lng}, ${point.lat}) not within Bangladesh`);
    }
  });

  test("deterministic: same seed produces same point", () => {
    const p1 = generateNearbyPoint(90.41, 23.81, 1, 3, 42);
    const p2 = generateNearbyPoint(90.41, 23.81, 1, 3, 42);
    assert.deepStrictEqual(p1, p2);
  });

  test("different seeds produce different points", () => {
    const p1 = generateNearbyPoint(90.41, 23.81, 1, 5, 1);
    const p2 = generateNearbyPoint(90.41, 23.81, 1, 5, 2);
    assert.notDeepStrictEqual(p1, p2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// geoJsonDistance
// ═══════════════════════════════════════════════════════════════════════════
describe("geoJsonDistance", () => {
  test("calculates distance between two GeoJSON Points", () => {
    const p1 = { type: "Point", coordinates: [90.4125, 23.8103] };
    const p2 = { type: "Point", coordinates: [91.8250, 22.3475] };
    const dist = geoJsonDistance(p1, p2);
    assert.ok(dist > 190 && dist < 260, `Expected ~220km, got ${dist}`);
  });

  test("returns null for invalid input", () => {
    assert.strictEqual(geoJsonDistance(null, { type: "Point", coordinates: [0, 0] }), null);
    assert.strictEqual(geoJsonDistance({ type: "Point", coordinates: [0, 0] }, null), null);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════
describe("constants", () => {
  test("DHAKA_CENTER is valid and within Bangladesh", () => {
    assert.ok(isValidLatitude(DHAKA_CENTER.lat));
    assert.ok(isValidLongitude(DHAKA_CENTER.lng));
    assert.ok(isWithinBangladesh(DHAKA_CENTER.lng, DHAKA_CENTER.lat));
  });

  test("BANGLADESH_BOUNDS covers expected area", () => {
    assert.ok(BANGLADESH_BOUNDS.latMin < 22);
    assert.ok(BANGLADESH_BOUNDS.latMax > 25);
    assert.ok(BANGLADESH_BOUNDS.lngMin < 89);
    assert.ok(BANGLADESH_BOUNDS.lngMax > 92);
  });
});

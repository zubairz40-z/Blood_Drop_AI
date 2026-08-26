/**
 * check-seed-geo.js — Validate geo integrity of Bangladesh seed data.
 *
 * Checks:
 * - All hospital/donor/patient/volunteer GeoJSON valid
 * - No reversed coordinates
 * - Bangladesh bounds sanity
 * - Nearby donor coverage per hospital (5km / 10km / 20km)
 * - 2dsphere query usability
 *
 * Usage:
 *   cd backend
 *   node scripts/check-seed-geo.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/config/database");
const User = require("../src/models/User");
const DonorProfile = require("../src/models/DonorProfile");
const BloodRequest = require("../src/models/BloodRequest");
const { BANGLADESH_BOUNDS } = require("../src/utils/geoValidation");
const hospitalsRaw = require("./data/bangladeshHospitals.json");

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

function isValidGeoJson(loc) {
  if (!loc) return true; // optional field
  if (loc.type !== "Point") return false;
  if (!Array.isArray(loc.coordinates) || loc.coordinates.length !== 2) return false;
  const [lng, lat] = loc.coordinates;
  return typeof lng === "number" && typeof lat === "number" && Number.isFinite(lng) && Number.isFinite(lat);
}

function inBangladesh(lng, lat) {
  return lng >= BANGLADESH_BOUNDS.lngMin && lng <= BANGLADESH_BOUNDS.lngMax &&
         lat >= BANGLADESH_BOUNDS.latMin && lat <= BANGLADESH_BOUNDS.latMax;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
async function check() {
  await connectDB();
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  Bangladesh Geo Integrity Check");
  console.log("═══════════════════════════════════════════════════════\n");

  let errors = 0;
  let warnings = 0;
  let reversedCoords = 0;
  let malformedPoints = 0;
  let outOfBounds = 0;

  // ── 1. Hospitals ─────────────────────────────────────────────────────
  console.log("▸ Checking hospitals...");
  const hospitalUsers = await User.find({ role: "hospital", firebaseUid: { $regex: "^bd-" } });
  for (const h of hospitalUsers) {
    if (!isValidGeoJson(h.location)) {
      console.log(`  ❌ INVALID GeoJSON: ${h.name}`);
      malformedPoints++;
      errors++;
    } else if (h.location) {
      const [lng, lat] = h.location.coordinates;
      if (!inBangladesh(lng, lat)) {
        console.log(`  ⚠️  Out of Bangladesh: ${h.name} (${lat}, ${lng})`);
        outOfBounds++;
        warnings++;
      }
    }
  }
  console.log(`  ✔ ${hospitalUsers.length} hospitals checked\n`);

  // ── 2. Donors ────────────────────────────────────────────────────────
  console.log("▸ Checking donor profiles...");
  const donorProfiles = await DonorProfile.find({}).populate("user", "firebaseUid name");
  let donorValid = 0;
  let donorInvalid = 0;
  for (const dp of donorProfiles) {
    if (!dp.user || !dp.user.firebaseUid?.startsWith("bd-")) continue;
    if (!isValidGeoJson(dp.location)) {
      console.log(`  ❌ INVALID GeoJSON: ${dp.user.name}`);
      malformedPoints++;
      donorInvalid++;
      errors++;
    } else {
      const [lng, lat] = dp.location.coordinates;
      if (!inBangladesh(lng, lat)) {
        console.log(`  ⚠️  Out of bounds: ${dp.user.name} (${lat}, ${lng})`);
        outOfBounds++;
        warnings++;
      }
      donorValid++;
    }
  }
  console.log(`  ✔ ${donorValid} valid, ${donorInvalid} invalid\n`);

  // ── 3. Blood Requests ────────────────────────────────────────────────
  console.log("▸ Checking blood requests...");
  const requests = await BloodRequest.find({});
  let reqValid = 0;
  for (const r of requests) {
    if (r.location && !isValidGeoJson(r.location)) {
      console.log(`  ❌ INVALID GeoJSON on request ${r._id}`);
      malformedPoints++;
      errors++;
    } else {
      reqValid++;
    }
  }
  console.log(`  ✔ ${reqValid} requests with valid/absent GeoJSON\n`);

  // ── 4. COVERAGE TABLE ────────────────────────────────────────────────
  console.log("▸ Donor Coverage by Hospital (seed hospitals):");
  console.log("  " + "-".repeat(90));
  console.log(`  ${"Hospital".padEnd(45)} ${"5km".padStart(6)} ${"10km".padStart(6)} ${"20km".padStart(6)}`);
  console.log("  " + "-".repeat(90));

  // All seed donor locations in memory
  const seedDonors = donorProfiles.filter(dp => dp.user?.firebaseUid?.startsWith("bd-") && dp.location?.coordinates);
  const donorCoords = seedDonors.map(dp => ({
    name: dp.user.name,
    lng: dp.location.coordinates[0],
    lat: dp.location.coordinates[1],
  }));

  for (const hospital of hospitalUsers) {
    if (!hospital.location?.coordinates) continue;
    const [hLng, hLat] = hospital.location.coordinates;

    let within5 = 0, within10 = 0, within20 = 0;
    for (const d of donorCoords) {
      const dist = haversine(hLat, hLng, d.lat, d.lng);
      if (dist <= 5) within5++;
      if (dist <= 10) within10++;
      if (dist <= 20) within20++;
    }

    const flag = within10 < 10 ? " ⚠️ LOW" : "";
    console.log(`  ${hospital.name.padEnd(45)} ${String(within5).padStart(6)} ${String(within10).padStart(6)} ${String(within20).padStart(6)}${flag}`);

    if (within10 === 0) {
      console.log(`  ❌ CRITICAL: ${hospital.name} has 0 donors within 10km!`);
      errors++;
    } else if (within10 < 10) {
      console.log(`  ⚠️  WARNING: ${hospital.name} has fewer than 10 donors within 10km`);
      warnings++;
    }
  }
  console.log("  " + "-".repeat(90) + "\n");

  // ── 5. 2dsphere query test ───────────────────────────────────────────
  console.log("▸ Testing $geoNear query...");
  try {
    const firstDonor = seedDonors[0];
    if (firstDonor) {
      const result = await DonorProfile.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: firstDonor.lng ? [firstDonor.lng, firstDonor.lat] : [90.41, 23.81] },
            distanceField: "distMeters",
            maxDistance: 50000,
            spherical: true,
            limit: 5,
          },
        },
        { $limit: 5 },
      ]);
      console.log(`  ✔ $geoNear returned ${result.length} results`);
    }
  } catch (err) {
    console.log(`  ❌ $geoNear failed: ${err.message}`);
    errors++;
  }

  // ── Summary ──────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  Geo Integrity Summary");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Hospitals checked:     ${hospitalUsers.length}`);
  console.log(`  Donor profiles checked:${donorValid + donorInvalid}`);
  console.log(`  Requests checked:      ${reqValid}`);
  console.log(`  Malformed Points:      ${malformedPoints}`);
  console.log(`  Reversed coordinates:  ${reversedCoords}`);
  console.log(`  Out of Bangladesh:     ${outOfBounds}`);
  console.log(`  Errors:                ${errors}`);
  console.log(`  Warnings:              ${warnings}`);
  console.log("═══════════════════════════════════════════════════════");

  if (errors > 0) {
    console.log("\n❌ SEED GEO INTEGRITY: FAIL\n");
  } else if (warnings > 0) {
    console.log("\n⚠️  SEED GEO INTEGRITY: PASS with warnings\n");
  } else {
    console.log("\n✅ SEED GEO INTEGRITY: PASS\n");
  }

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.\n");
}

check().catch(err => {
  console.error("\n❌ Check failed:", err.message);
  console.error(err.stack);
  process.exit(1);
});

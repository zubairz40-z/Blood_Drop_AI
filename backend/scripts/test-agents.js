require("dotenv").config();

const mongoose = require("mongoose");

/**
 * Exercises the three agents in Arefa's column against seeded data.
 *
 * Every funnel call passes donorFilter so the script only ever sees its own
 * donors. The database contains real and demo donor profiles — one of them
 * sits at exactly ORIGIN — and a test whose result changes when someone
 * registers is not a test.
 *
 * The important property under test is *consistency*: all three agents run
 * against one shared candidateSet and must never contradict each other.
 */

let passed = 0;
let failed = 0;

function check(label, condition, detail) {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.log(`  FAIL  ${label}`);
    if (detail !== undefined) console.log(`        ${JSON.stringify(detail)}`);
    failed++;
  }
}

const ORIGIN = { lng: 90.4125, lat: 23.8103 };

function kmEast(km) {
  return [ORIGIN.lng + km / 102, ORIGIN.lat];
}

function yearsAgo(n) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d;
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function minutesFromNow(n) {
  return new Date(Date.now() + n * 60000);
}

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);

  const User = require("../src/models/User");
  const DonorProfile = require("../src/models/DonorProfile");
  const BloodRequest = require("../src/models/BloodRequest");
  const { STATUS } = require("../src/utils/requestStatus");

  const matchingService = require("../src/services/matchingService");
  const matchingAgent = require("../src/agents/donorMatchingAgent");
  const eligibilityAgent = require("../src/agents/eligibilitySchedulingAgent");
  const geoAgent = require("../src/agents/geoCoordinationAgent");

  const TAG = "agenttest";
  const createdUserIds = [];
  const requestIds = [];

  async function seedDonor(label, profileOverrides) {
    const user = await User.create({
      firebaseUid: `${TAG}-${label}-${Date.now()}`,
      name: `Agent Test ${label}`,
      email: `${TAG}-${label}@example.invalid`,
      role: "donor",
    });
    createdUserIds.push(user._id);

    await DonorProfile.create({
      user: user._id,
      dateOfBirth: yearsAgo(30),
      weightKg: 70,
      bloodGroup: "O+",
      donationTypes: ["WHOLE_BLOOD"],
      eligibility: [],
      isAvailable: true,
      totalDonations: 0,
      location: { type: "Point", coordinates: kmEast(5) },
      ...profileOverrides,
    });

    return user._id;
  }

  async function makeRequest(overrides = {}) {
    const hospitalUser = await User.findOne({ role: "hospital" });
    if (!hospitalUser) throw new Error("No hospital user found in MongoDB");

    const r = await BloodRequest.create({
      createdBy: hospitalUser._id,
      hospital: hospitalUser._id,
      createdByHospital: true,
      patientName: "Agent Test Patient",
      bloodGroup: "O+",
      component: "WHOLE_BLOOD",
      unitsRequired: 1,
      urgency: "URGENT",
      neededBy: daysFromNow(2),
      status: STATUS.VERIFIED,
      location: { type: "Point", coordinates: [ORIGIN.lng, ORIGIN.lat] },
      ...overrides,
    });
    requestIds.push(r._id);
    return r;
  }

  console.log("\nSeeding donors...");

  const nearest = await seedDonor("nearest", {
    location: { type: "Point", coordinates: kmEast(2) },
  });
  const middle = await seedDonor("middle", {
    location: { type: "Point", coordinates: kmEast(9) },
  });
  const furthest = await seedDonor("furthest", {
    location: { type: "Point", coordinates: kmEast(18) },
    totalDonations: 5,
  });
  const deferred = await seedDonor("deferred", {
    location: { type: "Point", coordinates: kmEast(1) },
    eligibility: [{ component: "WHOLE_BLOOD", nextEligibleAt: daysFromNow(10) }],
  });
  const longDeferred = await seedDonor("longdeferred", {
    location: { type: "Point", coordinates: kmEast(1) },
    eligibility: [{ component: "WHOLE_BLOOD", nextEligibleAt: daysFromNow(200) }],
  });
  const tooOld = await seedDonor("tooold", {
    dateOfBirth: yearsAgo(75),
    location: { type: "Point", coordinates: kmEast(1) },
  });

  console.log(`Seeded ${createdUserIds.length} donors.`);

  // Restrict every funnel call to this script's own donors.
  const seededOnly = { user: { $in: createdUserIds } };

  const request = await makeRequest();

  // One funnel run, shared across all three agents — exactly how the
  // AI Manager will drive them.
  const candidateSet = await matchingService.findCandidates(request._id, {
    donorFilter: seededOnly,
  });
  console.log(`\nFunnel returned ${candidateSet.candidates.length} candidates.`);

  // ---------------------------------------------------------------
  console.log("\n1. Donor Matching Agent");
  // ---------------------------------------------------------------
  const match = await matchingAgent.selectDonors(request._id, { candidateSet });

  check("names a primary", Boolean(match.primary), match.primary);
  check(
    "primary is a real candidate",
    candidateSet.candidates.some((c) => c.donorId === match.primary)
  );
  check("backups exclude the primary", !match.backups.includes(match.primary));
  check("contactOrder starts with the primary", match.contactOrder[0] === match.primary);
  check(
    "contactOrder has no duplicates",
    new Set(match.contactOrder).size === match.contactOrder.length
  );
  check("reports a margin", typeof match.margin === "number", match.margin);
  check("gives a deterministic reason", match.reason.length > 0, match.reason);

  // ---------------------------------------------------------------
  console.log("\n2. Eligibility & Scheduling Agent");
  // ---------------------------------------------------------------
  const assessment = await eligibilityAgent.assessDonors(request._id, {
    candidateSet,
    donorIds: [deferred, longDeferred, tooOld],
  });

  check(
    "eligible donors are listed",
    assessment.eligibleNow.length === candidateSet.candidates.length,
    { agent: assessment.eligibleNow.length, funnel: candidateSet.candidates.length }
  );
  check(
    "donor deferred 10 days lands in 'later'",
    assessment.later.some((d) => d.donorId === String(deferred)),
    assessment.later
  );
  check(
    "donor deferred 200 days is excluded, beyond horizon",
    assessment.excluded.some((d) => d.donorId === String(longDeferred))
  );
  check(
    "age-excluded donor has no future date",
    assessment.excluded.find((d) => d.donorId === String(tooOld))?.nextEligibleAt === null
  );
  check("reports sufficiency", typeof assessment.sufficient === "boolean");
  check("gives a deterministic summary", assessment.summary.length > 0, assessment.summary);

  // ---------------------------------------------------------------
  console.log("\n3. Geo Coordination Agent");
  // ---------------------------------------------------------------
  const geo = await geoAgent.coordinate(request._id, {
    candidateSet,
    neededBy: request.neededBy,
  });

  check("prefers the nearest donor", geo.preferred === String(nearest), geo.preferred);
  check("names a backup", Boolean(geo.backup));
  check(
    "byEta is sorted ascending",
    geo.byEta.every((c, i) => i === 0 || geo.byEta[i - 1].etaMinutes <= c.etaMinutes),
    geo.byEta.map((c) => c.etaMinutes)
  );
  check("reports spread", typeof geo.spreadKm === "number", geo.spreadKm);
  check("exposes the speed assumption", geo.assumedSpeedKmh === 25);
  check(
    "all candidates reachable within two days",
    geo.reachableCount === candidateSet.candidates.length
  );

  // ---------------------------------------------------------------
  console.log("\n4. Agents agree with each other");
  // ---------------------------------------------------------------
  check(
    "matching agent's primary is eligible per eligibility agent",
    assessment.eligibleNow.includes(match.primary)
  );
  check(
    "geo agent's preferred is eligible per eligibility agent",
    assessment.eligibleNow.includes(geo.preferred)
  );
  check(
    "every contactOrder donor is eligible",
    match.contactOrder.every((id) => assessment.eligibleNow.includes(id))
  );

  console.log(
    `  NOTE  matching picked ${match.primary === geo.preferred ? "the same" : "a different"} donor to geo`
  );

  // ---------------------------------------------------------------
  console.log("\n5. Impossible deadline");
  // ---------------------------------------------------------------
  const tight = await makeRequest({ neededBy: minutesFromNow(2) });
  const tightSet = await matchingService.findCandidates(tight._id, {
    donorFilter: seededOnly,
  });
  const tightGeo = await geoAgent.coordinate(tight._id, {
    candidateSet: tightSet,
    neededBy: tight.neededBy,
  });

  check("nobody can arrive in 2 minutes", tightGeo.reachableCount === 0, tightGeo.reachableCount);
  check("still names a preferred donor", Boolean(tightGeo.preferred));
  check(
    "summary says the deadline is unreachable",
    tightGeo.summary.includes("deadline"),
    tightGeo.summary
  );

  // ---------------------------------------------------------------
  console.log("\n6. No candidates at all");
  // ---------------------------------------------------------------
  // AB- accepts only O-, A-, B-, AB-. Every seeded donor is O+, so with the
  // funnel scoped to seeded donors this must return nothing.
  const impossible = await makeRequest({ bloodGroup: "AB-" });
  const emptySet = await matchingService.findCandidates(impossible._id, {
    donorFilter: seededOnly,
  });

  check("funnel returns nothing", emptySet.candidates.length === 0, emptySet.candidates.length);

  const emptyMatch = await matchingAgent.selectDonors(impossible._id, {
    candidateSet: emptySet,
  });
  check("matching agent returns null primary, not an error", emptyMatch.primary === null);
  check("matching agent explains why", emptyMatch.reason.length > 0, emptyMatch.reason);

  const emptyGeo = await geoAgent.coordinate(impossible._id, { candidateSet: emptySet });
  check("geo agent returns null preferred", emptyGeo.preferred === null);
  check("geo agent has no spread", emptyGeo.spreadKm === null);

  // ---------------------------------------------------------------
  console.log("\nCleaning up...");
  // ---------------------------------------------------------------
  await DonorProfile.deleteMany({ user: { $in: createdUserIds } });
  await User.deleteMany({ _id: { $in: createdUserIds } });
  await BloodRequest.deleteMany({ _id: { $in: requestIds } });
  console.log(`Removed ${createdUserIds.length} donors and ${requestIds.length} requests.`);

  console.log(`\n${passed} passed, ${failed} failed`);
  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(async (err) => {
  console.error("\nScript failed:", err.message);
  console.error(err.stack);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
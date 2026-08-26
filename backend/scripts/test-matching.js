require("dotenv").config();

const mongoose = require("mongoose");

/**
 * Exercises the matching funnel end to end.
 *
 * Unlike test-donations.js this calls the service directly rather than over
 * HTTP — there is no matching endpoint yet (that arrives with the agents),
 * and the point here is the ranking logic, not the transport.
 *
 * Seeds its own donors as MongoDB-only records: findCandidates never touches
 * Firebase, so there is no reason to clutter the auth console with accounts
 * that exist for ten seconds.
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

/** Dhaka city centre-ish — the hospital sits here. */
const ORIGIN = { lng: 90.4125, lat: 23.8103 };

/**
 * Offsets a coordinate by roughly N km due east.
 * At this latitude one degree of longitude is about 102 km, which is close
 * enough for a test fixture — we assert on ordering, not on exact metres.
 */
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

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);

  const User = require("../src/models/User");
  const DonorProfile = require("../src/models/DonorProfile");
  const BloodRequest = require("../src/models/BloodRequest");
  const matchingService = require("../src/services/matchingService");
  const { STATUS } = require("../src/utils/requestStatus");

  const TAG = "matchtest";
  const createdUserIds = [];

  /** Creates a MongoDB-only donor. No Firebase account. */
  async function seedDonor(label, profileOverrides) {
    const user = await User.create({
      firebaseUid: `${TAG}-${label}-${Date.now()}`,
      name: `Match Test ${label}`,
      email: `${TAG}-${label}@example.invalid`,
      role: "donor",
    });
    createdUserIds.push(user._id);

    await DonorProfile.create({
      user: user._id,
      dateOfBirth: yearsAgo(30),
      weightKg: 70,
      bloodGroup: "O+",
      donationTypes: ["WHOLE_BLOOD", "PLASMA"],
      eligibility: [],
      isAvailable: true,
      totalDonations: 0,
      location: { type: "Point", coordinates: kmEast(5) },
      ...profileOverrides,
    });

    return user._id;
  }

  console.log("\nSeeding donors...");

  // Distance ladder — all O+, all eligible, differing only in distance
  const near = await seedDonor("near", {
    location: { type: "Point", coordinates: kmEast(1) },
  });
  const mid = await seedDonor("mid", {
    location: { type: "Point", coordinates: kmEast(8) },
  });
  const far = await seedDonor("far", {
    location: { type: "Point", coordinates: kmEast(20) },
  });

  // Outside even the EMERGENCY radius of 50 km
  const outOfRange = await seedDonor("outofrange", {
    location: { type: "Point", coordinates: kmEast(80) },
  });

  // Same distance as `mid`, but with donation history
  const experienced = await seedDonor("experienced", {
    location: { type: "Point", coordinates: kmEast(8) },
    totalDonations: 5,
  });

  // Far enough out that no amount of history should beat a 1 km donor under
  // EMERGENCY weighting — the margin here is around 30 points, not 2, so the
  // assertion doesn't hinge on fixture rounding.
  const distantVeteran = await seedDonor("distantveteran", {
    location: { type: "Point", coordinates: kmEast(30) },
    totalDonations: 5,
  });

  // Each of these should be filtered out for exactly one reason
  const wrongGroup = await seedDonor("wronggroup", {
    bloodGroup: "AB+",
    location: { type: "Point", coordinates: kmEast(2) },
  });
  const unavailable = await seedDonor("unavailable", {
    isAvailable: false,
    location: { type: "Point", coordinates: kmEast(2) },
  });
  const wrongComponent = await seedDonor("wrongcomponent", {
    donationTypes: ["PLASMA"],
    location: { type: "Point", coordinates: kmEast(2) },
  });
  const deferred = await seedDonor("deferred", {
    location: { type: "Point", coordinates: kmEast(2) },
    eligibility: [
      { component: "WHOLE_BLOOD", nextEligibleAt: daysFromNow(30) },
    ],
  });
  const underage = await seedDonor("underage", {
    dateOfBirth: yearsAgo(15),
    location: { type: "Point", coordinates: kmEast(2) },
  });

  console.log(`Seeded ${createdUserIds.length} donors.`);

  // A hospital user to own the request
  const hospitalUser = await User.findOne({ role: "hospital" });
  if (!hospitalUser) throw new Error("No hospital user found in MongoDB");

  /** Builds a VERIFIED request at ORIGIN. */
  async function makeRequest(overrides = {}) {
    return BloodRequest.create({
      createdBy: hospitalUser._id,
      hospital: hospitalUser._id,
      createdByHospital: true,
      patientName: "Match Test Patient",
      bloodGroup: "O+",
      component: "WHOLE_BLOOD",
      unitsRequired: 1,
      urgency: "URGENT",
      neededBy: daysFromNow(2),
      status: STATUS.VERIFIED,
      location: { type: "Point", coordinates: [ORIGIN.lng, ORIGIN.lat] },
      ...overrides,
    });
  }

  const requestIds = [];

  // ---------------------------------------------------------------
  console.log("\n1. The funnel filters correctly");
  // ---------------------------------------------------------------
  const req = await makeRequest();
  requestIds.push(req._id);

  const result = await matchingService.findCandidates(req._id);
  const ids = result.candidates.map((c) => c.donorId);

  check(
    "returns the contract shape",
    Boolean(result.requestId && Array.isArray(result.candidates))
  );
  check("radius is 25 km for URGENT", result.radiusKm === 25, result.radiusKm);

  check("near donor included", ids.includes(String(near)));
  check("mid donor included", ids.includes(String(mid)));
  check("far donor included", ids.includes(String(far)));
  check("experienced donor included", ids.includes(String(experienced)));

  check("donor beyond radius excluded", !ids.includes(String(outOfRange)));
  check("incompatible group excluded", !ids.includes(String(wrongGroup)));
  check("unavailable donor excluded", !ids.includes(String(unavailable)));
  check("donor not offering component excluded", !ids.includes(String(wrongComponent)));
  check("deferred donor excluded", !ids.includes(String(deferred)));
  check("underage donor excluded", !ids.includes(String(underage)));

  // ---------------------------------------------------------------
  console.log("\n2. Ranking");
  // ---------------------------------------------------------------
  // Under URGENT weighting a full donation history is worth more than 7 km,
  // so the experienced donor legitimately outranks the nearer one here.
  check(
    "experienced donor outranks nearer donor under URGENT",
    ids[0] === String(experienced),
    ids[0]
  );

  const midCand = result.candidates.find((c) => c.donorId === String(mid));
  const expCand = result.candidates.find((c) => c.donorId === String(experienced));
  check(
    "history breaks a distance tie",
    expCand && midCand && expCand.score > midCand.score,
    { experienced: expCand?.score, mid: midCand?.score }
  );

  const scores = result.candidates.map((c) => c.score);
  check(
    "candidates are sorted by score",
    scores.every((s, i) => i === 0 || scores[i - 1] >= s),
    scores
  );

  // ---------------------------------------------------------------
  console.log("\n3. Distance and ETA");
  // ---------------------------------------------------------------
  const nearCand = result.candidates.find((c) => c.donorId === String(near));
  check("near donor is about 1 km away", nearCand.distanceKm < 2, nearCand.distanceKm);
  check("eta is derived from distance", nearCand.etaMinutes >= 1, nearCand.etaMinutes);
  check(
    "further donor has longer eta",
    result.candidates.find((c) => c.donorId === String(far)).etaMinutes >
      nearCand.etaMinutes
  );
  check("reasons are populated", nearCand.reasons.length > 0);

  // ---------------------------------------------------------------
  console.log("\n4. Urgency changes radius and weighting");
  // ---------------------------------------------------------------
  const emergency = await makeRequest({ urgency: "EMERGENCY" });
  requestIds.push(emergency._id);
  const emergencyResult = await matchingService.findCandidates(emergency._id);
  check("EMERGENCY uses a 50 km radius", emergencyResult.radiusKm === 50);

  const nearEm = emergencyResult.candidates.find((c) => c.donorId === String(near));
  const vetEm = emergencyResult.candidates.find(
    (c) => c.donorId === String(distantVeteran)
  );
  check(
    "EMERGENCY puts a 1 km newcomer above a 30 km veteran",
    nearEm && vetEm && nearEm.score > vetEm.score,
    { near: nearEm?.score, veteran: vetEm?.score }
  );
  check(
    "EMERGENCY weights distance at 90",
    emergencyResult.weights.distance === 90,
    emergencyResult.weights
  );

  const routine = await makeRequest({ urgency: "ROUTINE" });
  requestIds.push(routine._id);
  const routineResult = await matchingService.findCandidates(routine._id);
  check("ROUTINE uses a 10 km radius", routineResult.radiusKm === 10);
  check(
    "ROUTINE finds fewer donors than URGENT",
    routineResult.candidates.length < result.candidates.length,
    { routine: routineResult.candidates.length, urgent: result.candidates.length }
  );

  // ---------------------------------------------------------------
  console.log("\n5. Plasma uses the inverted table");
  // ---------------------------------------------------------------
  // An O+ recipient can receive plasma from every group, so the AB+ donor
  // who was excluded for whole blood should now appear.
  const plasmaReq = await makeRequest({ component: "PLASMA" });
  requestIds.push(plasmaReq._id);
  const plasmaResult = await matchingService.findCandidates(plasmaReq._id);
  const plasmaIds = plasmaResult.candidates.map((c) => c.donorId);
  check(
    "AB+ donor is a valid plasma donor for O+",
    plasmaIds.includes(String(wrongGroup)),
    plasmaIds.length
  );

  // ---------------------------------------------------------------
  console.log("\n6. Guards");
  // ---------------------------------------------------------------
  const pending = await makeRequest({ status: STATUS.PENDING_VERIFICATION });
  requestIds.push(pending._id);
  try {
    await matchingService.findCandidates(pending._id);
    check("unverified request rejected", false, "no error thrown");
  } catch (err) {
    check("unverified request rejected", err.status === 409, err.message);
  }

  // The 2dsphere index refuses a Point with no coordinates at insert time,
  // so this document has to be written with the index bypassed — which is
  // exactly the state a legacy or partially-migrated record could be in.
  const noCoords = await makeRequest();
  requestIds.push(noCoords._id);
  await BloodRequest.collection.updateOne(
    { _id: noCoords._id },
    { $unset: { location: "" } }
  );
  try {
    await matchingService.findCandidates(noCoords._id);
    check("request without coordinates rejected", false, "no error thrown");
  } catch (err) {
    check("request without coordinates rejected", err.status === 409, err.message);
  }

  // ---------------------------------------------------------------
  console.log("\n7. explainDonor");
  // ---------------------------------------------------------------
  const okExplain = await matchingService.explainDonor(req._id, near);
  check("eligible donor explained as eligible", okExplain.eligible === true, okExplain);

  const badExplain = await matchingService.explainDonor(req._id, deferred);
  check("deferred donor explained with a reason", badExplain.eligible === false);
  check("explanation names the deferral", badExplain.reasons.length > 0, badExplain.reasons);

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
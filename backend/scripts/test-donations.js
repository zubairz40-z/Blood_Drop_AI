require("dotenv").config();

const mongoose = require("mongoose");

const API_KEY = process.env.FIREBASE_WEB_API_KEY;
const SERVER = `http://localhost:${process.env.PORT || 5000}`;

const PATIENT = { email: "patient@test.com", password: "Test1234" };
const HOSPITAL = { email: "hospital@test.com", password: "Test1234" };
const DONOR = { email: "donor@test.com", password: "Test1234" };

async function signIn({ email, password }) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${email}: ${data.error?.message}`);
  return data.idToken;
}

async function call(path, token, method = "GET", body) {
  const res = await fetch(`${SERVER}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

function futureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

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

/**
 * Forces a request into MATCHED and links a donor.
 *
 * This is the shortcut the whole script exists for: matching (C4) and donor
 * accept/decline (C11) don't exist yet, so there is no legitimate route to
 * MATCHED. We write directly to Mongo rather than through the API, on purpose
 * — this is scaffolding, and it disappears once C11 lands.
 */
async function forceMatched(requestId, actorId) {
  const BloodRequest = require("../src/models/BloodRequest");
  const request = await BloodRequest.findById(requestId);
  if (!request) throw new Error(`Request ${requestId} not found in DB`);

  // Step through the legal path so statusHistory stays honest
  if (request.status === "PENDING_VERIFICATION") {
    request.applyStatus("VERIFIED", actorId, "Forced by test script");
  }
  if (request.status === "VERIFIED") {
    request.applyStatus("MATCHING", actorId, "Forced by test script");
  }
  if (request.status === "MATCHING") {
    request.applyStatus("MATCHED", actorId, "Forced by test script");
  }

  await request.save();
  return request;
}

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);

  const User = require("../src/models/User");
  const Donation = require("../src/models/Donation");
  const DonorProfile = require("../src/models/DonorProfile");
  const BloodRequest = require("../src/models/BloodRequest");

  console.log("Signing in...");
  const patientToken = await signIn(PATIENT);
  const hospitalToken = await signIn(HOSPITAL);
  const donorToken = await signIn(DONOR);

  const donorUser = await User.findOne({ email: DONOR.email });
  const hospitalUser = await User.findOne({ email: HOSPITAL.email });
  if (!donorUser) throw new Error("Donor user not found in MongoDB");
  if (!hospitalUser) throw new Error("Hospital user not found in MongoDB");

  // ---------------------------------------------------------------
  console.log("\n1. Create a request and force it to MATCHED");
  // ---------------------------------------------------------------
  const created = await call("/api/requests", patientToken, "POST", {
    hospital: String(hospitalUser._id),
    bloodGroup: "O+",
    component: "WHOLE_BLOOD",
    unitsRequired: 1,
    urgency: "URGENT",
    neededBy: futureDate(3),
  });
  check("request created", created.status === 201, created.data);

  const requestId =
    created.data?.request?._id ||
    created.data?.request?.id ||
    created.data?.data?._id;
  if (!requestId) throw new Error("No request id returned — cannot continue");

  const forced = await forceMatched(requestId, hospitalUser._id);
  check("request is MATCHED", forced.status === "MATCHED", forced.status);

  // ---------------------------------------------------------------
  console.log("\n2. Authorization");
  // ---------------------------------------------------------------
  const asDonor = await call("/api/donations", donorToken, "POST", {
    requestId,
    donorId: String(donorUser._id),
  });
  check("donor cannot record a donation", asDonor.status === 403, asDonor.status);

  const asPatient = await call("/api/donations", patientToken, "POST", {
    requestId,
    donorId: String(donorUser._id),
  });
  check("patient cannot record a donation", asPatient.status === 403, asPatient.status);

  // ---------------------------------------------------------------
  console.log("\n3. Record the donation");
  // ---------------------------------------------------------------
  const recorded = await call("/api/donations", hospitalToken, "POST", {
    requestId,
    donorId: String(donorUser._id),
    units: 1,
  });
  check("hospital records donation", recorded.status === 201, recorded.data);

  const donationId = recorded.data?.donation?._id;
  check("donation starts PENDING", recorded.data?.donation?.status === "PENDING");
  check(
    "component copied from request",
    recorded.data?.donation?.component === "WHOLE_BLOOD"
  );

  const future = await call("/api/donations", hospitalToken, "POST", {
    requestId,
    donorId: String(donorUser._id),
    donatedAt: futureDate(5),
  });
  check("future donation rejected", future.status === 400, future.status);

  // ---------------------------------------------------------------
  console.log("\n4. Confirm, and check the fan-out");
  // ---------------------------------------------------------------
  const confirmed = await call(
    `/api/donations/${donationId}/confirm`,
    hospitalToken,
    "PATCH"
  );
  check("donation confirmed", confirmed.status === 200, confirmed.data);
  check("status is CONFIRMED", confirmed.data?.donation?.status === "CONFIRMED");

  const profile = await DonorProfile.findOne({ user: donorUser._id });
  const entry = profile?.eligibility?.find((e) => e.component === "WHOLE_BLOOD");

  check("eligibility entry exists for WHOLE_BLOOD", Boolean(entry));
  check("nextEligibleAt is set", Boolean(entry?.nextEligibleAt));
  check(
    "deferral is 56 days from donatedAt",
    entry?.nextEligibleAt &&
      Math.round(
        (new Date(entry.nextEligibleAt) - new Date(entry.lastDonationAt)) /
          86400000
      ) === 56,
    entry?.nextEligibleAt
  );

  // The point of the per-component model: other components untouched
  const plasmaEntry = profile?.eligibility?.find((e) => e.component === "PLASMA");
  check(
    "plasma eligibility not affected",
    !plasmaEntry || !plasmaEntry.nextEligibleAt,
    plasmaEntry
  );

  const afterConfirm = await BloodRequest.findById(requestId);
  check("unitsFulfilled incremented", afterConfirm.unitsFulfilled === 1);
  check(
    "request auto-closed to FULFILLED",
    afterConfirm.status === "FULFILLED",
    afterConfirm.status
  );

  // ---------------------------------------------------------------
  console.log("\n5. Guards");
  // ---------------------------------------------------------------
  const twice = await call(
    `/api/donations/${donationId}/confirm`,
    hospitalToken,
    "PATCH"
  );
  check("cannot confirm twice", twice.status === 409, twice.status);

  const cancelConfirmed = await call(
    `/api/donations/${donationId}/cancel`,
    hospitalToken,
    "PATCH",
    { reason: "test" }
  );
  check(
    "cannot cancel a confirmed donation",
    cancelConfirmed.status === 409,
    cancelConfirmed.status
  );

  // Request is now FULFILLED, and the donor is deferred — either way, refused
  const second = await call("/api/donations", hospitalToken, "POST", {
    requestId,
    donorId: String(donorUser._id),
  });
  check("further donation refused", second.status === 409, second.data?.message);

  // ---------------------------------------------------------------
  console.log("\n6. Reads");
  // ---------------------------------------------------------------
  const history = await call("/api/donations/my", donorToken);
  check("donor sees own history", history.status === 200, history.status);
  check(
    "history contains the donation",
    Array.isArray(history.data?.donations) && history.data.donations.length > 0
  );

  const pending = await call("/api/donations/pending", hospitalToken);
  check("hospital sees pending queue", pending.status === 200, pending.status);

  const byId = await call(`/api/donations/${donationId}`, donorToken);
  check("donor reads own donation", byId.status === 200, byId.status);

  const byIdAsPatient = await call(`/api/donations/${donationId}`, patientToken);
  check(
    "unrelated patient blocked",
    byIdAsPatient.status === 403,
    byIdAsPatient.status
  );

  // ---------------------------------------------------------------
  console.log("\nCleaning up...");
  // ---------------------------------------------------------------
  await Donation.deleteMany({ request: requestId });
  await BloodRequest.findByIdAndDelete(requestId);

  // Reset the donor's whole-blood eligibility so the script is re-runnable
  if (profile) {
    profile.eligibility = profile.eligibility.filter(
      (e) => e.component !== "WHOLE_BLOOD"
    );
    profile.totalDonations = Math.max(0, (profile.totalDonations || 1) - 1);
    await profile.save();
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(async (err) => {
  console.error("\nScript failed:", err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
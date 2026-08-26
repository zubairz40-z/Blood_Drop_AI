require("dotenv").config();

const API_KEY = process.env.FIREBASE_WEB_API_KEY;
const SERVER = `http://localhost:${process.env.PORT || 5000}`;

const PATIENT = { email: "patient@test.com", password: process.env.TEST_PATIENT_PASSWORD || "Test1234" };
const HOSPITAL = { email: "hospital@test.com", password: process.env.TEST_HOSPITAL_PASSWORD || "Test1234" };
const DONOR = { email: "donor@test.com", password: process.env.TEST_DONOR_PASSWORD || "Test1234" };

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

async function run() {
  const patientToken = await signIn(PATIENT);
  const hospitalToken = await signIn(HOSPITAL);
  const donorToken = await signIn(DONOR);

  // Need the hospital's Mongo _id to address the request to them
  const me = await call("/api/auth/me", hospitalToken);
  const hospitalId = me.data.user._id;
  console.log(`\nHospital id: ${hospitalId}`);

  const NEW_REQUEST = {
    hospital: hospitalId,
    bloodGroup: "O+",
    component: "WHOLE_BLOOD",
    unitsRequired: 2,
    urgency: "URGENT",
    neededBy: futureDate(3),
    location: {
      type: "Point",
      coordinates: [90.4125, 23.8103],
      address: "Dhaka Medical College",
    },
    patientNote: "Scheduled surgery",
  };

  console.log("\n1. Patient creates a request");
  const created = await call("/api/requests", patientToken, "POST", NEW_REQUEST);
  console.log(`   ${created.status} — status: ${created.data.request?.status}`);
  const requestId = created.data.request?._id;

  console.log("\n2. Donor tries to create one (should be 403)");
  const donorCreate = await call("/api/requests", donorToken, "POST", NEW_REQUEST);
  console.log(`   ${donorCreate.status} — ${donorCreate.data.message}`);

  console.log("\n3. Patient lists their requests");
  const mine = await call("/api/requests/my", patientToken);
  console.log(`   ${mine.status} — count: ${mine.data.count}`);

  console.log("\n4. Hospital sees it in their queue");
  const queue = await call("/api/requests/my", hospitalToken);
  console.log(`   ${queue.status} — count: ${queue.data.count}`);

  console.log("\n5. Donor tries to read it (should be 403)");
  const peek = await call(`/api/requests/${requestId}`, donorToken);
  console.log(`   ${peek.status} — ${peek.data.message}`);

  console.log("\n6. Patient edits units");
  const edit = await call(`/api/requests/${requestId}`, patientToken, "PATCH", { unitsRequired: 3 });
  console.log(`   ${edit.status} — units: ${edit.data.request?.unitsRequired}`);

  console.log("\n7. Patient tries to edit status directly (whitelist should drop it)");
  const sneaky = await call(`/api/requests/${requestId}`, patientToken, "PATCH", {
    status: "FULFILLED",
    patientNote: "still pending",
  });
  console.log(`   ${sneaky.status} — status is still: ${sneaky.data.request?.status}`);

  console.log("\n8. Hospital verifies");
  const verified = await call(`/api/requests/${requestId}/verify`, hospitalToken, "POST");
  console.log(`   ${verified.status} — status: ${verified.data.request?.status}`);

  console.log("\n9. Hospital verifies again (should be 409)");
  const twice = await call(`/api/requests/${requestId}/verify`, hospitalToken, "POST");
  console.log(`   ${twice.status} — ${twice.data.message}`);

  console.log("\n10. Patient cancels");
  const cancelled = await call(`/api/requests/${requestId}/cancel`, patientToken, "POST", {
    reason: "Found a donor privately",
  });
  console.log(`   ${cancelled.status} — status: ${cancelled.data.request?.status}, history: ${cancelled.data.request?.statusHistory?.length} entries`);

  console.log("\n11. Editing a cancelled request (should be 409)");
  const afterCancel = await call(`/api/requests/${requestId}`, patientToken, "PATCH", { unitsRequired: 5 });
  console.log(`   ${afterCancel.status} — ${afterCancel.data.message}`);

  console.log("\n12. Past neededBy date (should be 400)");
  const past = await call("/api/requests", patientToken, "POST", {
    ...NEW_REQUEST,
    neededBy: "2020-01-01",
  });
  console.log(`   ${past.status} — ${past.data.message}`);

  console.log("\n13. Unknown request id (should be 404)");
  const missing = await call("/api/requests/000000000000000000000000", patientToken);
  console.log(`   ${missing.status} — ${missing.data.message}`);

  const passed =
    created.status === 201 &&
    created.data.request?.status === "PENDING_VERIFICATION" &&
    donorCreate.status === 403 &&
    peek.status === 403 &&
    edit.data.request?.unitsRequired === 3 &&
    sneaky.data.request?.status === "PENDING_VERIFICATION" &&
    verified.data.request?.status === "VERIFIED" &&
    twice.status === 409 &&
    cancelled.data.request?.status === "CANCELLED" &&
    afterCancel.status === 409 &&
    past.status === 400 &&
    missing.status === 404;

  console.log(passed ? "\n🎉 Blood Request API works.\n" : "\n⚠️  Check the output above.\n");
}

run().catch((err) => console.error("\n❌", err.message, "\n"));
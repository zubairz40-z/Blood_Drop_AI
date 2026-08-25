require("dotenv").config();

const API_KEY = process.env.FIREBASE_WEB_API_KEY;
const SERVER = `http://localhost:${process.env.PORT || 5000}`;

const HOSPITAL = { email: "hospital@test.com", password: "Test1234" };
const PATIENT = { email: "patient@test.com", password: "Test1234" };

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
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

function futureDate(hours) {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

async function run() {
  const hospitalToken = await signIn(HOSPITAL);
  const patientToken = await signIn(PATIENT);

  const me = await call("/api/auth/me", patientToken);
  const patientPhone = me.data.user.phone;
  console.log(`\nRegistered patient phone: ${patientPhone}`);

  const base = {
    bloodGroup: "O-",
    component: "WHOLE_BLOOD",
    unitsRequired: 4,
    urgency: "EMERGENCY",
    neededBy: futureDate(3),
    patientNote: "Road traffic accident, brought in by a passer-by",
  };

  console.log("\n1. Hospital files for an unidentified patient");
  const unidentified = await call("/api/requests", hospitalToken, "POST", {
    ...base,
    patientName: "Unidentified male, approx. 30",
  });
  console.log(`   ${unidentified.status} — status: ${unidentified.data.request?.status}`);
  console.log(`   createdByHospital: ${unidentified.data.request?.createdByHospital}`);
  console.log(`   patient linked: ${unidentified.data.request?.patient || "none"}`);

  console.log("\n2. Hospital files with a phone that matches a BloodDrop patient");
  const linked = await call("/api/requests", hospitalToken, "POST", {
    ...base,
    patientName: "Known Patient",
    patientPhone,
  });
  console.log(`   ${linked.status} — patient linked: ${linked.data.request?.patient ? "yes" : "no"}`);

  console.log("\n3. Hospital request with no patient name (should be 400)");
  const noName = await call("/api/requests", hospitalToken, "POST", base);
  console.log(`   ${noName.status} — ${noName.data.message}`);

  console.log("\n4. Hospital sees its own request in the queue");
  const queue = await call("/api/requests/my", hospitalToken);
  const selfFiled = queue.data.requests?.filter((r) => r.createdByHospital).length;
  console.log(`   ${queue.status} — self-filed requests: ${selfFiled}`);

  console.log("\n5. Linked patient sees the request the hospital filed for them");
  const patientView = await call("/api/requests/my", patientToken);
  const filedForThem = patientView.data.requests?.filter((r) => r.createdByHospital).length;
  console.log(`   ${patientView.status} — visible to patient: ${filedForThem}`);

  console.log("\n6. Hospital cancels its own request");
  const cancelled = await call(
    `/api/requests/${unidentified.data.request?._id}/cancel`,
    hospitalToken,
    "POST",
    { reason: "Patient stabilised, blood no longer needed" }
  );
  console.log(`   ${cancelled.status} — status: ${cancelled.data.request?.status}`);

  const passed =
    unidentified.status === 201 &&
    unidentified.data.request?.status === "VERIFIED" &&
    unidentified.data.request?.createdByHospital === true &&
    !unidentified.data.request?.patient &&
    linked.status === 201 &&
    !!linked.data.request?.patient &&
    noName.status === 400 &&
    filedForThem > 0 &&
    cancelled.data.request?.status === "CANCELLED";

  console.log(passed ? "\n🎉 Hospital emergency requests work.\n" : "\n⚠️  Check the output above.\n");
}

run().catch((err) => console.error("\n❌", err.message, "\n"));
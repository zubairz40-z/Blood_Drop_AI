require("dotenv").config();

const API_KEY = process.env.FIREBASE_WEB_API_KEY;
const SERVER = `http://localhost:${process.env.PORT || 5000}`;

const HOSPITAL_EMAIL = `hospital-${Date.now()}@test.com`;
const HOSPITAL_PASSWORD = "Test1234";

const ADMIN_EMAIL = "admin@blooddrop.local";
const ADMIN_PASSWORD = "ChangeThisNow123";

async function firebase(action, email, password) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:${action}?key=${API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Firebase failed");
  return data;
}

async function call(path, token, method = "POST", body) {
  const res = await fetch(`${SERVER}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : (method === "GET" ? undefined : "{}"),
  });
  return { status: res.status, data: await res.json() };
}

async function run() {
  console.log("\n1. Register a new hospital");
  const hospital = await firebase("signUp", HOSPITAL_EMAIL, HOSPITAL_PASSWORD);
  const reg = await call("/api/auth/register", hospital.idToken, "POST", {
    name: "Test Hospital",
    role: "hospital",
    phone: "01700000009",
  });
  console.log(`   status ${reg.status}, accountStatus: ${reg.data.user?.accountStatus}`);
  const hospitalId = reg.data.user?._id;

  console.log("\n2. Hospital tries to log in (should be blocked)");
  const blocked = await call("/api/auth/login", hospital.idToken);
  console.log(`   status ${blocked.status} — ${blocked.data.message}`);

  console.log("\n3. Sign in as admin");
  const admin = await firebase("signInWithPassword", ADMIN_EMAIL, ADMIN_PASSWORD);
  console.log("   ok");

  console.log("\n4. Non-admin tries the admin route (should be 403)");
  const forbidden = await call("/api/admin/pending", hospital.idToken, "GET");
  console.log(`   status ${forbidden.status} — ${forbidden.data.message}`);

  console.log("\n5. Admin lists pending accounts");
  const pending = await call("/api/admin/pending", admin.idToken, "GET");
  console.log(`   status ${pending.status}, count: ${pending.data.count}`);

  console.log("\n6. Admin approves the hospital");
  const approved = await call(`/api/admin/users/${hospitalId}/approve`, admin.idToken, "PATCH");
  console.log(`   status ${approved.status}, accountStatus: ${approved.data.user?.accountStatus}`);

  console.log("\n7. Hospital logs in again (should work now)");
  const nowIn = await call("/api/auth/login", hospital.idToken);
  console.log(`   status ${nowIn.status}, role: ${nowIn.data.user?.role}`);

  console.log("\n8. Approving twice (should be 409)");
  const again = await call(`/api/admin/users/${hospitalId}/approve`, admin.idToken, "PATCH");
  console.log(`   status ${again.status} — ${again.data.message}`);

  const passed =
    reg.data.user?.accountStatus === "pending" &&
    blocked.status === 403 &&
    forbidden.status === 403 &&
    pending.status === 200 &&
    approved.status === 200 &&
    nowIn.status === 200 &&
    again.status === 409;

  console.log(passed ? "\n🎉 Approval flow works.\n" : "\n⚠️  Check the output above.\n");
  console.log(`   (test hospital: ${HOSPITAL_EMAIL})\n`);
}

run().catch((err) => console.error("\n❌", err.message, "\n"));
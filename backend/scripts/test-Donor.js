require("dotenv").config();

const API_KEY = process.env.FIREBASE_WEB_API_KEY;
const SERVER = `http://localhost:${process.env.PORT || 5000}`;

const DONOR = { email: "donor@test.com", password: "Test1234" };
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
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

const VALID_PROFILE = {
  dateOfBirth: "2000-05-15",
  weightKg: 68,
  bloodGroup: "O+",
  donationTypes: ["WHOLE_BLOOD", "PLASMA"],
  location: {
    type: "Point",
    coordinates: [90.4125, 23.8103], // Dhaka: [lng, lat]
    address: "Bashundhara R/A, Dhaka",
  },
};

async function run() {
  const donorToken = await signIn(DONOR);
  const patientToken = await signIn(PATIENT);

  console.log("\n1. Create donor profile");
  let created = await call("/api/donors/profile", donorToken, "POST", VALID_PROFILE);
  if (created.status === 409) {
    console.log("   409 — profile already exists (fine, continuing)");
  } else {
    console.log(`   ${created.status} — components: ${created.data.profile?.eligibility?.map(e => e.component).join(", ")}`);
  }

  console.log("\n2. Duplicate profile (should be 409)");
  const dup = await call("/api/donors/profile", donorToken, "POST", VALID_PROFILE);
  console.log(`   ${dup.status} — ${dup.data.message}`);

  console.log("\n3. Read own profile");
  const read = await call("/api/donors/profile", donorToken);
  console.log(`   ${read.status} — blood group: ${read.data.profile?.bloodGroup}, available: ${read.data.profile?.isAvailable}`);

  console.log("\n4. Update weight");
  const upd = await call("/api/donors/profile", donorToken, "PATCH", { weightKg: 72 });
  console.log(`   ${upd.status} — weight now: ${upd.data.profile?.weightKg}`);

  console.log("\n5. Add PLATELETS to donation types");
  const addType = await call("/api/donors/profile", donorToken, "PATCH", {
    donationTypes: ["WHOLE_BLOOD", "PLASMA", "PLATELETS"],
  });
  console.log(`   ${addType.status} — eligibility entries: ${addType.data.profile?.eligibility?.length}`);

  console.log("\n6. Toggle availability off");
  const avail = await call("/api/donors/availability", donorToken, "PATCH", { isAvailable: false });
  console.log(`   ${avail.status} — isAvailable: ${avail.data.isAvailable}`);
  await call("/api/donors/availability", donorToken, "PATCH", { isAvailable: true }); // reset

  console.log("\n7. History (stub)");
  const hist = await call("/api/donors/history", donorToken);
  console.log(`   ${hist.status} — totalDonations: ${hist.data.totalDonations}`);

  console.log("\n8. Underweight for DOUBLE_RED_CELLS (should be 400)");
  const light = await call("/api/donors/profile", donorToken, "PATCH", {
    weightKg: 55,
    donationTypes: ["DOUBLE_RED_CELLS"],
  });
  console.log(`   ${light.status} — ${light.data.message}`);

  console.log("\n9. Unknown component (should be 400)");
  const badType = await call("/api/donors/profile", donorToken, "PATCH", {
    donationTypes: ["UNICORN_BLOOD"],
  });
  console.log(`   ${badType.status} — ${badType.data.message?.slice(0, 50)}`);

  console.log("\n10. Patient hitting a donor route (should be 403)");
  const wrongRole = await call("/api/donors/profile", patientToken);
  console.log(`   ${wrongRole.status} — ${wrongRole.data.message}`);

  console.log("\n11. No token (should be 401)");
  const noAuth = await call("/api/donors/profile", null);
  console.log(`   ${noAuth.status}`);

  const passed =
    dup.status === 409 &&
    read.status === 200 &&
    upd.data.profile?.weightKg === 72 &&
    addType.data.profile?.eligibility?.length === 3 &&
    avail.data.isAvailable === false &&
    hist.status === 200 &&
    light.status === 400 &&
    badType.status === 400 &&
    wrongRole.status === 403 &&
    noAuth.status === 401;

  console.log(passed ? "\n🎉 Donor Profile API works.\n" : "\n⚠️  Check the output above.\n");
}

run().catch((err) => console.error("\n❌", err.message, "\n"));
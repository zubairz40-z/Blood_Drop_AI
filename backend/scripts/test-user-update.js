require("dotenv").config();

const API_KEY = process.env.FIREBASE_WEB_API_KEY;
const SERVER = `http://localhost:${process.env.PORT || 5000}`;

const EMAIL = "donor@test.com";
const PASSWORD = "Test1234";

async function signIn() {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message);
  return data.idToken;
}

async function patch(token, body) {
  const res = await fetch(`${SERVER}/api/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function run() {
  const token = await signIn();

  console.log("\n1. Update name and phone");
  const ok = await patch(token, { name: "Updated Donor", phone: "01711111111" });
  console.log(`   ${ok.status} — name: ${ok.data.user?.name}, phone: ${ok.data.user?.phone}`);

  console.log("\n2. Try to escalate to admin");
  const escalate = await patch(token, { role: "admin", accountStatus: "active" });
  console.log(`   ${escalate.status} — role is still: ${escalate.data.user?.role}`);

  console.log("\n3. Try to change firebaseUid");
  const uid = await patch(token, { name: "Still Fine", firebaseUid: "hacked-uid-123" });
  console.log(`   ${uid.status} — uid unchanged: ${uid.data.user?.firebaseUid?.slice(0, 12)}...`);

  console.log("\n4. Invalid blood group (should be 400)");
  const bad = await patch(token, { bloodGroup: "Z+" });
  console.log(`   ${bad.status} — ${bad.data.message?.slice(0, 60)}`);

  console.log("\n5. Empty update (should be 400)");
  const empty = await patch(token, {});
  console.log(`   ${empty.status} — ${empty.data.message}`);

  console.log("\n6. No token (should be 401)");
  const noAuth = await fetch(`${SERVER}/api/users/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Nope" }),
  });
  console.log(`   ${noAuth.status}`);

    const passed =
    ok.status === 200 &&
    ok.data.user?.name === "Updated Donor" &&
    escalate.status === 400 &&
    uid.status === 200 &&
    uid.data.user?.role === "donor" &&
    bad.status === 400 &&
    empty.status === 400 &&
    noAuth.status === 401;

  console.log(passed ? "\n🎉 PATCH /api/users/me is secure.\n" : "\n⚠️  Check the output above.\n");
}

run().catch((err) => console.error("\n❌", err.message, "\n"));
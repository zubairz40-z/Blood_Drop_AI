require("dotenv").config();

const API_KEY = process.env.FIREBASE_WEB_API_KEY;
const SERVER = `http://localhost:${process.env.PORT || 5000}`;

async function signIn(email, password) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message);
  return data.idToken;
}

async function run() {
  const token = await signIn("patient@test.com", "Test1234");

  console.log("\n1. Patient lists hospitals");
  const res = await fetch(`${SERVER}/api/hospitals`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  console.log(`   ${res.status} — count: ${data.count}`);
  console.log(JSON.stringify(data.hospitals, null, 2));

  console.log("\n2. No token (should be 401)");
  const noAuth = await fetch(`${SERVER}/api/hospitals`);
  console.log(`   ${noAuth.status}`);
}

run().catch((err) => console.error("\n❌", err.message, "\n"));
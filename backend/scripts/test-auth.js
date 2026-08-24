require("dotenv").config();

const API_KEY = process.env.FIREBASE_WEB_API_KEY;
const SERVER = `http://localhost:${process.env.PORT || 5000}`;



const TEST_EMAIL = "hospital@test.com";
const TEST_PASSWORD = "Test1234";
const TEST_PROFILE = { name: "Test Hospital", role: "hospital", phone: "01700000002", bloodGroup: "O+" };



// Talk to Firebase directly, the same way the browser SDK does
async function firebaseAuth(action) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:${action}?key=${API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      returnSecureToken: true,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Firebase auth failed");
  return data;
}

async function callServer(path, token, body) {
  const res = await fetch(`${SERVER}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function run() {
  console.log("\n--- STEP 1: Firebase sign-in ---");

  let session;
  try {
    session = await firebaseAuth("signUp");
    console.log("✅ Created new Firebase user");
  } catch (err) {
    if (err.message === "EMAIL_EXISTS") {
      session = await firebaseAuth("signInWithPassword");
      console.log("✅ Signed in to existing Firebase user");
    } else if (err.message === "OPERATION_NOT_ALLOWED") {
      console.error("❌ Email/Password sign-in is NOT enabled in the Firebase console.");
      console.error("   Enable it, then run this again.");
      return;
    } else {
      console.error("❌ Firebase error:", err.message);
      return;
    }
  }

  console.log("   UID:", session.localId);
  console.log("   Token received:", session.idToken.slice(0, 20) + "...");

  console.log("\n--- STEP 2: POST /api/auth/register ---");
  const reg = await callServer("/api/auth/register", session.idToken, TEST_PROFILE);
  console.log("   Status:", reg.status);
  console.log("   Response:", JSON.stringify(reg.data, null, 2));

  console.log("\n--- STEP 3: POST /api/auth/login ---");
  const login = await callServer("/api/auth/login", session.idToken);
  console.log("   Status:", login.status);
  console.log("   Response:", JSON.stringify(login.data, null, 2));

  console.log("\n--- STEP 4: rejecting a bad token ---");
  const bad = await callServer("/api/auth/login", "not-a-real-token");
  console.log("   Status:", bad.status, "(should be 401)");
  console.log("   Response:", JSON.stringify(bad.data));

  if (login.status === 200 && bad.status === 401) {
    console.log("\n🎉 Auth system works end to end.\n");
  } else {
    console.log("\n⚠️  Something is off — check the output above.\n");
  }
}

run();
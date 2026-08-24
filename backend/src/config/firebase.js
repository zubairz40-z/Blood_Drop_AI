const { initializeApp, cert, applicationDefault } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

function initFirebase() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({ credential: cert(serviceAccount) });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    initializeApp({ credential: applicationDefault() });
  } else {
    try {
      const serviceAccount = require("../../serviceAccountKey.json");
      initializeApp({ credential: cert(serviceAccount) });
    } catch {
      console.warn("⚠️  No Firebase credentials found. Firebase auth will not work.");
      return;
    }
  }
  console.log("✅ Firebase Admin initialized");
}

initFirebase();

module.exports = { getAuth };

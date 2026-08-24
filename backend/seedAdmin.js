require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const { getAuth } = require("./config/firebaseAdmin");

const ADMIN_EMAIL = "admin@blooddrop.local";
const ADMIN_PASSWORD = "ChangeThisNow123";
const ADMIN_NAME = "System Admin";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  let firebaseUser;
  try {
    firebaseUser = await getAuth().getUserByEmail(ADMIN_EMAIL);
    console.log("Firebase user already exists:", firebaseUser.uid);
  } catch {
    firebaseUser = await getAuth().createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      displayName: ADMIN_NAME,
    });
    console.log("Created Firebase user:", firebaseUser.uid);
  }

  const existing = await User.findOne({ firebaseUid: firebaseUser.uid });
  if (existing) {
    console.log("Admin profile already exists.");
  } else {
    await User.create({
      firebaseUid: firebaseUser.uid,
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      role: "admin",
      accountStatus: "active",
    });
    console.log("Created admin profile.");
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
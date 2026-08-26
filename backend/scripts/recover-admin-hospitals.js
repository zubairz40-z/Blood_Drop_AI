/**
 * Targeted recovery for the admin and Bangladesh hospital user records.
 *
 * Passwords are supplied through environment variables and are never stored
 * in MongoDB or this source file. This script does not delete any records.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/config/database");
const { getAuth } = require("../src/config/firebase");
const User = require("../src/models/User");
const hospitals = require("./data/bangladeshHospitals.json");

const ADMIN = {
  name: "Arefa",
  email: "arefa@gmail.com",
  role: "admin",
  passwordEnv: "RECOVERY_ADMIN_PASSWORD",
};

const HOSPITAL_ACCOUNTS = [
  ["Evercare Hospital Dhaka", "evercare@gmail.com", "RECOVERY_HOSPITAL_PASSWORD_EVERCARE"],
  ["Square Hospitals Ltd", "square@gmail.com", "RECOVERY_HOSPITAL_PASSWORD_SQUARE"],
  ["United Hospital Limited", "united@gmail.com", "RECOVERY_HOSPITAL_PASSWORD_UNITED"],
  ["LABAID Specialized Hospital", "labaid@gmail.com", "RECOVERY_HOSPITAL_PASSWORD_LABAID"],
  ["Popular Medical College Hospital", "popular@gmail.com", "RECOVERY_HOSPITAL_PASSWORD_POPULAR"],
  ["Ibn Sina Specialized Hospital", "ibnsina@gmail.com", "RECOVERY_HOSPITAL_PASSWORD_IBNSINA"],
  ["Bangladesh Specialized Hospital", "bsh@gmail.com", "RECOVERY_HOSPITAL_PASSWORD_BSH"],
  ["Green Life Medical College Hospital", "greenlife@gmail.com", "RECOVERY_HOSPITAL_PASSWORD_GREENLIFE"],
  ["Anwer Khan Modern Medical College Hospital", "anwerkhan@gmail.com", "RECOVERY_HOSPITAL_PASSWORD_ANWERKHAN"],
  ["Holy Family Red Crescent Medical College Hospital", "holyfamily@gmail.com", "RECOVERY_HOSPITAL_PASSWORD_HOLYFAMILY"],
  ["Dhaka Medical College Hospital", "dmch@gmail.com", "RECOVERY_HOSPITAL_PASSWORD_DMCH"],
  ["Kurmitola General Hospital", "kurmitola@gmail.com", "RECOVERY_HOSPITAL_PASSWORD_KURMITOLA"],
  ["BIRDEM General Hospital", "birdem@gmail.com", "RECOVERY_HOSPITAL_PASSWORD_BIRDEM"],
  ["National Heart Foundation Hospital & Research Institute", "nhf@gmail.com", "RECOVERY_HOSPITAL_PASSWORD_NHF"],
  ["Ahsania Mission Cancer & General Hospital", "ahsania@gmail.com", "RECOVERY_HOSPITAL_PASSWORD_AHSANIA"],
  ["Asgar Ali Hospital", "asgarali@gmail.com", "RECOVERY_HOSPITAL_PASSWORD_ASGARALI"],
  ["Shaheed Suhrawardy Medical College Hospital", "suhrawardy@gmail.com", "RECOVERY_HOSPITAL_PASSWORD_SUHRAWARDY"],
  ["National Institute of Neurosciences & Hospital", "nins@gmail.com", "RECOVERY_HOSPITAL_PASSWORD_NINS"],
  ["Chattogram Medical College Hospital", "cmch@gmail.com", "RECOVERY_HOSPITAL_PASSWORD_CMCH"],
  ["Sylhet MAG Osmani Medical College Hospital", "osmani@gmail.com", "RECOVERY_HOSPITAL_PASSWORD_OSMANI"],
];

function getHospitalData(name) {
  const hospital = hospitals.find((item) => item.name === name);
  if (!hospital) throw new Error(`Missing hospital seed data: ${name}`);
  return hospital;
}

async function getOrCreateFirebaseUser(email, password, name, role, existingName = null) {
  const auth = getAuth();
  let firebaseUser;
  try {
    firebaseUser = await auth.getUserByEmail(email);
    const mongoOwner = await User.findOne({ firebaseUid: firebaseUser.uid }).lean();
    if (mongoOwner && mongoOwner.email !== email.toLowerCase()) {
      throw new Error(`Firebase UID belongs to Mongo user ${mongoOwner.email}`);
    }
    await auth.updateUser(firebaseUser.uid, { password, displayName: name });
  } catch (error) {
    if (error.code !== "auth/user-not-found") throw error;
    firebaseUser = await auth.createUser({ email, password, displayName: name });
  }

  const existingByEmail = await User.findOne({ email: email.toLowerCase() }).lean();
  if (existingByEmail && existingByEmail.firebaseUid !== firebaseUser.uid) {
    throw new Error(`Mongo email collision: ${email} is owned by ${existingByEmail.role}`);
  }

  const existingByName = existingName
    ? await User.findOne({ name: existingName, role }).lean()
    : null;
  const existingUser = existingByEmail || existingByName || await User.findOne({ firebaseUid: firebaseUser.uid }).lean();
  if (existingUser && existingUser.role !== role) {
    throw new Error(`${name} is already a Mongo ${existingUser.role}, not ${role}`);
  }

  const update = { firebaseUid: firebaseUser.uid, email: email.toLowerCase(), name, role, accountStatus: "active" };
  const user = existingUser
    ? await User.findOneAndUpdate({ _id: existingUser._id }, { $set: update }, { new: true })
    : await User.create(update);
  return { firebaseUser, user };
}

async function main() {
  const credentials = { admin: process.env[ADMIN.passwordEnv], hospitals: {} };
  if (!credentials.admin) throw new Error(`Missing ${ADMIN.passwordEnv}`);
  for (const [, email, passwordEnv] of HOSPITAL_ACCOUNTS) {
    credentials.hospitals[email] = process.env[passwordEnv];
    if (!credentials.hospitals[email]) throw new Error(`Missing ${passwordEnv}`);
  }

  await connectDB();
  const admin = await getOrCreateFirebaseUser(ADMIN.email, credentials.admin, ADMIN.name, ADMIN.role);
  console.log(`ADMIN_RESTORED ${admin.user.email} ${admin.firebaseUser.uid}`);

  for (const [name, email] of HOSPITAL_ACCOUNTS) {
    const data = getHospitalData(name);
    const result = await getOrCreateFirebaseUser(email, credentials.hospitals[email], name, "hospital", name);
    await User.updateOne(
      { _id: result.user._id },
      {
        $set: {
          address: data.address,
          location: { type: "Point", coordinates: [data.lng, data.lat] },
        },
      }
    );
    console.log(`HOSPITAL_RESTORED ${name} ${email} ${result.firebaseUser.uid}`);
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(`RECOVERY_FAILED ${error.message}`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
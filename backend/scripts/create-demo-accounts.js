/**
 * create-demo-accounts.js — Creates Firebase Auth + MongoDB accounts for
 * all seeded hospitals, featured donors, patient, volunteer, and admin.
 *
 * Passwords are read from the local gitignored credentials file.
 * If it does not exist, random passwords are generated and written to it.
 *
 * Usage:
 *   cd backend
 *   node scripts/create-demo-accounts.js
 *
 * Safe to run multiple times — idempotent (reuses existing accounts).
 * Only modifies accounts with @blooddrop.test emails.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const connectDB = require("../src/config/database");
const { getAuth } = require("../src/config/firebase");
const User = require("../src/models/User");
const DonorProfile = require("../src/models/DonorProfile");

const CRED_PATH = path.join(__dirname, "..", ".demo-hospital-credentials.json");

function generatePassword() {
  return crypto.randomBytes(8).toString("base64url").slice(0, 12);
}

// ═══════════════════════════════════════════════════════════════════════════
// ACCOUNT DEFINITIONS — no passwords, those come from credentials file
// ═══════════════════════════════════════════════════════════════════════════
const HOSPITAL_ACCOUNTS = [
  { hospitalName: "Evercare Hospital Dhaka", email: "evercare.hospital@blooddrop.test", key: "evercare" },
  { hospitalName: "Square Hospitals Ltd", email: "square.hospital@blooddrop.test", key: "square" },
  { hospitalName: "United Hospital Limited", email: "united.hospital@blooddrop.test", key: "united" },
  { hospitalName: "LABAID Specialized Hospital", email: "labaid.hospital@blooddrop.test", key: "labaid" },
  { hospitalName: "Popular Medical College Hospital", email: "popular.hospital@blooddrop.test", key: "popular" },
  { hospitalName: "Ibn Sina Specialized Hospital", email: "ibnsina.hospital@blooddrop.test", key: "ibnsina" },
  { hospitalName: "Bangladesh Specialized Hospital", email: "bsh.hospital@blooddrop.test", key: "bsh" },
  { hospitalName: "Green Life Medical College Hospital", email: "greenlife.hospital@blooddrop.test", key: "greenlife" },
  { hospitalName: "Anwer Khan Modern Medical College Hospital", email: "anwerkhan.hospital@blooddrop.test", key: "anwerkhan" },
  { hospitalName: "Holy Family Red Crescent Medical College Hospital", email: "holyfamily.hospital@blooddrop.test", key: "holyfamily" },
  { hospitalName: "Dhaka Medical College Hospital", email: "dmch.hospital@blooddrop.test", key: "dmch" },
  { hospitalName: "Kurmitola General Hospital", email: "kurmitola.hospital@blooddrop.test", key: "kurmitola" },
  { hospitalName: "BIRDEM General Hospital", email: "birdem.hospital@blooddrop.test", key: "birdem" },
  { hospitalName: "National Heart Foundation Hospital & Research Institute", email: "nhf.hospital@blooddrop.test", key: "nhf" },
  { hospitalName: "Ahsania Mission Cancer & General Hospital", email: "ahsania.hospital@blooddrop.test", key: "ahsania" },
  { hospitalName: "Asgar Ali Hospital", email: "asgarali.hospital@blooddrop.test", key: "asgarali" },
  { hospitalName: "Shaheed Suhrawardy Medical College Hospital", email: "suhrawardy.hospital@blooddrop.test", key: "suhrawardy" },
  { hospitalName: "National Institute of Neurosciences & Hospital", email: "nins.hospital@blooddrop.test", key: "nins" },
  { hospitalName: "Chattogram Medical College Hospital", email: "cmch.hospital@blooddrop.test", key: "cmch" },
  { hospitalName: "Sylhet MAG Osmani Medical College Hospital", email: "osmani.hospital@blooddrop.test", key: "osmani" },
];

const FEATURED_DONOR_DEFS = [
  {
    name: "Tanvir Hasan", email: "evercare.donor@blooddrop.test", key: "evercareDonor",
    bloodGroup: "A+", donationTypes: ["WHOLE_BLOOD", "PLASMA"],
    lat: 23.8220, lng: 90.4380, address: "Block C, Bashundhara R/A, Dhaka",
  },
  {
    name: "Nusrat Rahman", email: "square.donor@blooddrop.test", key: "squareDonor",
    bloodGroup: "A+", donationTypes: ["WHOLE_BLOOD", "PLASMA", "PLATELETS"],
    lat: 23.7620, lng: 90.3780, address: "Green Road, Farmgate, Dhaka",
  },
  {
    name: "Arif Chowdhury", email: "united.donor@blooddrop.test", key: "unitedDonor",
    bloodGroup: "B+", donationTypes: ["WHOLE_BLOOD", "PLATELETS"],
    lat: 23.7975, lng: 90.4100, address: "Banani 11, Dhaka",
  },
  {
    name: "Sabbir Ahmed", email: "kurmitola.donor@blooddrop.test", key: "kurmitolaDonor",
    bloodGroup: "O+", donationTypes: ["WHOLE_BLOOD", "PLASMA", "PLATELETS", "DOUBLE_RED_CELLS"],
    lat: 23.8310, lng: 90.4010, address: "Uttara Sector 7, Dhaka",
  },
  {
    name: "Farzana Begum", email: "cmch.donor@blooddrop.test", key: "cmchDonor",
    bloodGroup: "O+", donationTypes: ["WHOLE_BLOOD", "PLASMA"],
    lat: 22.3510, lng: 91.8280, address: "Nasirabad, Chattogram",
  },
  {
    name: "Rakib Islam", email: "osmani.donor@blooddrop.test", key: "osmaniDonor",
    bloodGroup: "B+", donationTypes: ["WHOLE_BLOOD", "PLATELETS"],
    lat: 24.8970, lng: 91.8730, address: "Zindabazar, Sylhet",
  },
];

const PATIENT_DEF = {
  name: "Rahima Khatun", email: "patient.demo@blooddrop.test", key: "patient",
  bloodGroup: "A+", lat: 23.7560, lng: 90.3830, address: "Dhanmondi 27, Dhaka",
  dateOfBirth: new Date("1992-05-15"),
};

const VOLUNTEER_DEF = {
  name: "Kamal Hossain", email: "volunteer.demo@blooddrop.test", key: "volunteer",
  lat: 23.7500, lng: 90.3900, address: "Farmgate, Dhaka",
};

// ═══════════════════════════════════════════════════════════════════════════
// CREDENTIALS FILE — passwords stored here only (gitignored)
// ═══════════════════════════════════════════════════════════════════════════
function loadOrCreateCredentials() {
  if (fs.existsSync(CRED_PATH)) {
    return JSON.parse(fs.readFileSync(CRED_PATH, "utf8"));
  }

  // Generate passwords for all accounts
  const creds = { hospitals: {}, donors: {}, patient: null, volunteer: null };
  for (const h of HOSPITAL_ACCOUNTS) {
    creds.hospitals[h.key] = generatePassword();
  }
  for (const d of FEATURED_DONOR_DEFS) {
    creds.donors[d.key] = generatePassword();
  }
  creds.patient = generatePassword();
  creds.volunteer = generatePassword();

  fs.writeFileSync(CRED_PATH, JSON.stringify(creds, null, 2));
  console.log(`  📄 Generated credentials file: ${CRED_PATH}`);
  return creds;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════
async function ensureFirebaseAndMongo({ email, password, name, role, extraFields = {} }) {
  let firebaseUser;
  try {
    firebaseUser = await getAuth().getUserByEmail(email);
    await getAuth().updateUser(firebaseUser.uid, { password, displayName: name });
  } catch {
    firebaseUser = await getAuth().createUser({ email, password, displayName: name });
  }

  let mongoUser = await User.findOne({ firebaseUid: firebaseUser.uid });
  if (!mongoUser) {
    mongoUser = await User.create({
      firebaseUid: firebaseUser.uid, email, name, role,
      accountStatus: "active", ...extraFields,
    });
  } else {
    mongoUser.name = name;
    mongoUser.role = role;
    Object.assign(mongoUser, extraFields);
    await mongoUser.save();
  }
  return { firebaseUser, mongoUser };
}

async function ensureDonorProfile(userId, { bloodGroup, donationTypes, lat, lng, address }) {
  let profile = await DonorProfile.findOne({ user: userId });
  if (!profile) {
    profile = await DonorProfile.create({
      user: userId, dateOfBirth: new Date("1995-01-15"), weightKg: 65,
      bloodGroup, donationTypes,
      location: { type: "Point", coordinates: [lng, lat], address },
      isAvailable: true, totalDonations: 0,
      eligibility: donationTypes.map((c) => ({ component: c, donationsThisYear: 0 })),
    });
  }
  return profile;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════
async function createDemoAccounts() {
  await connectDB();
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  BloodDrop — Demo Account Creation");
  console.log("═══════════════════════════════════════════════════════\n");

  const creds = loadOrCreateCredentials();
  let hospitalCount = 0;
  let donorCount = 0;

  // ── 1. Hospital accounts ──────────────────────────────────────────────
  console.log("▸ Creating hospital demo accounts...");
  for (const acct of HOSPITAL_ACCOUNTS) {
    try {
      const seededHospital = await User.findOne({ name: acct.hospitalName, role: "hospital" });
      if (!seededHospital) { console.log(`  ⚠ Not found in seed: ${acct.hospitalName}`); continue; }

      const password = creds.hospitals[acct.key];
      const { firebaseUser, mongoUser } = await ensureFirebaseAndMongo({
        email: acct.email, password, name: acct.hospitalName, role: "hospital",
        extraFields: { address: seededHospital.address, location: seededHospital.location, phone: seededHospital.phone },
      });

      if (seededHospital.firebaseUid !== firebaseUser.uid) {
        seededHospital.firebaseUid = firebaseUser.uid;
        await seededHospital.save();
      }

      hospitalCount++;
      console.log(`  ✔ ${acct.hospitalName}`);
    } catch (err) {
      console.error(`  ✗ ${acct.hospitalName}: ${err.message}`);
    }
  }

  // ── 2. Featured donor accounts ────────────────────────────────────────
  console.log("\n▸ Creating featured donor demo accounts...");
  for (const def of FEATURED_DONOR_DEFS) {
    try {
      const password = creds.donors[def.key];
      const { firebaseUser, mongoUser } = await ensureFirebaseAndMongo({
        email: def.email, password, name: def.name, role: "donor",
        extraFields: {
          bloodGroup: def.bloodGroup, address: def.address,
          location: { type: "Point", coordinates: [def.lng, def.lat] },
        },
      });

      await ensureDonorProfile(mongoUser._id, {
        bloodGroup: def.bloodGroup, donationTypes: def.donationTypes,
        lat: def.lat, lng: def.lng, address: def.address,
      });

      donorCount++;
      console.log(`  ✔ ${def.name} (${def.bloodGroup})`);
    } catch (err) {
      console.error(`  ✗ ${def.name}: ${err.message}`);
    }
  }

  // ── 3. Patient account ────────────────────────────────────────────────
  console.log("\n▸ Creating patient demo account...");
  try {
    const { firebaseUser, mongoUser } = await ensureFirebaseAndMongo({
      email: PATIENT_DEF.email, password: creds.patient, name: PATIENT_DEF.name, role: "patient",
      extraFields: {
        bloodGroup: PATIENT_DEF.bloodGroup, address: PATIENT_DEF.address,
        location: { type: "Point", coordinates: [PATIENT_DEF.lng, PATIENT_DEF.lat] },
        dateOfBirth: PATIENT_DEF.dateOfBirth,
      },
    });
    console.log(`  ✔ ${PATIENT_DEF.name}`);
  } catch (err) {
    console.error(`  ✗ Patient: ${err.message}`);
  }

  // ── 4. Volunteer account ──────────────────────────────────────────────
  console.log("\n▸ Creating volunteer demo account...");
  try {
    const { firebaseUser, mongoUser } = await ensureFirebaseAndMongo({
      email: VOLUNTEER_DEF.email, password: creds.volunteer, name: VOLUNTEER_DEF.name, role: "volunteer",
      extraFields: {
        address: VOLUNTEER_DEF.address,
        location: { type: "Point", coordinates: [VOLUNTEER_DEF.lng, VOLUNTEER_DEF.lat] },
      },
    });
    console.log(`  ✔ ${VOLUNTEER_DEF.name}`);
  } catch (err) {
    console.error(`  ✗ Volunteer: ${err.message}`);
  }

  // ── Summary ───────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  Demo Accounts Created!");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Hospitals:   ${hospitalCount}`);
  console.log(`  Donors:      ${donorCount}`);
  console.log(`  Patient:     1`);
  console.log(`  Volunteer:   1`);
  console.log(`  Credentials: ${CRED_PATH}`);
  console.log("═══════════════════════════════════════════════════════\n");

  await mongoose.disconnect();
  process.exit(0);
}

createDemoAccounts().catch((err) => {
  console.error("\n❌ Demo account creation failed:", err.message);
  console.error(err.stack);
  process.exit(1);
});

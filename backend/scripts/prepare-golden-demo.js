/**
 * prepare-golden-demo.js
 * ----------------------------------------------------------------------------
 * Aligns a SMALL, CLEARLY-DEMO set of accounts into a golden end-to-end
 * matching scenario around West Panthapath, Dhaka.
 *
 * It only touches accounts whose email ends in "@blooddrop.test" and the
 * DonorProfiles / Deferrals that belong to them. It never wipes a collection,
 * never deletes a real user, and never stores a password in Mongo.
 *
 * Idempotent: running it twice produces the same state and no duplicates.
 *
 * Scenario it builds:
 *   Hospital : Square Hospitals Ltd  (square.hospital@blooddrop.test)  - Panthapath
 *   Patient  : Rahima Khatun         (patient.demo@blooddrop.test)     - Panthapath
 *   Donor 1  : Nusrat Rahman         (square.donor@blooddrop.test)   O+  ~0.2 km   <- primary
 *   Donor 2  : Sabbir Ahmed          (kurmitola.donor@blooddrop.test) O+ ~1.1 km   <- backup
 *   Donor 3  : Farzana Begum         (cmch.donor@blooddrop.test)      O+ ~1.6 km   <- backup
 *
 *   Golden request: O+  WHOLE_BLOOD  1 unit  URGENT  (created later via the UI)
 *
 * Usage:  cd backend && node scripts/prepare-golden-demo.js
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const connectDB = require("../src/config/database");
const User = require("../src/models/User");
const DonorProfile = require("../src/models/DonorProfile");
const { Deferral } = require("../src/models/Deferral");

// GeoJSON is [longitude, latitude] — never [lat, lng], never [0,0].
const PANTHAPATH_HOSPITAL = [90.38110, 23.75880]; // Square Hospitals, West Panthapath
const PANTHAPATH_PATIENT = [90.38040, 23.76010]; // ~0.17 km away
const DONOR_PRIMARY = [90.38180, 23.75980]; // ~0.13 km from hospital
const DONOR_BACKUP_1 = [90.37650, 23.76400]; // ~1.1 km
const DONOR_BACKUP_2 = [90.39150, 23.76600]; // ~1.6 km

const ADULT_DOB = new Date("1996-04-12"); // ~30 years old on run date

function km(msg) {
  console.log(msg);
}

/** Wipe any timing/medical block on a donor profile so they are eligible now. */
function clearEligibility(profile, components) {
  const byComponent = new Map((profile.eligibility || []).map((e) => [e.component, e]));
  for (const component of components) {
    const entry = byComponent.get(component) || { component };
    entry.lastDonationAt = null;
    entry.nextEligibleAt = null;
    entry.donationsThisYear = 0;
    entry.medicallyDeferredUntil = null;
    entry.deferralReason = undefined;
    byComponent.set(component, entry);
  }
  profile.eligibility = [...byComponent.values()];
}

async function alignDonor({ email, coordinates, address, isPrimary }) {
  const user = await User.findOne({ email, role: "donor" });
  if (!user) {
    km(`  ! donor ${email} not found — skipped`);
    return null;
  }

  user.bloodGroup = "O+";
  user.accountStatus = "active";
  user.location = { type: "Point", coordinates };
  user.address = address;
  await user.save();

  let profile = await DonorProfile.findOne({ user: user._id });
  if (!profile) {
    profile = new DonorProfile({
      user: user._id,
      dateOfBirth: ADULT_DOB,
      weightKg: 70,
      bloodGroup: "O+",
      donationTypes: ["WHOLE_BLOOD", "PLASMA", "PLATELETS", "DOUBLE_RED_CELLS"],
      eligibility: [],
      location: { type: "Point", coordinates, address },
      isAvailable: true,
      totalDonations: isPrimary ? 4 : 2,
    });
  }

  profile.bloodGroup = "O+";
  profile.weightKg = Math.max(profile.weightKg || 0, 70);
  profile.dateOfBirth = profile.dateOfBirth || ADULT_DOB;
  const types = new Set(profile.donationTypes || []);
  ["WHOLE_BLOOD", "PLASMA", "PLATELETS", "DOUBLE_RED_CELLS"].forEach((t) => types.add(t));
  profile.donationTypes = [...types];
  profile.location = { type: "Point", coordinates, address };
  profile.isAvailable = true;
  clearEligibility(profile, ["WHOLE_BLOOD", "PLASMA", "PLATELETS", "DOUBLE_RED_CELLS"]);
  await profile.save();

  // Remove any active deferral that would exclude this golden donor.
  const del = await Deferral.deleteMany({ donor: user._id });

  km(`  ok ${user.name} <${email}>  O+  ${JSON.stringify(coordinates)}  deferrals removed: ${del.deletedCount}`);
  return { user, profile };
}

async function main() {
  await connectDB();
  km("\n=== prepare-golden-demo (Panthapath) ===\n");

  // --- Hospital ---
  const hospital = await User.findOne({ email: "square.hospital@blooddrop.test", role: "hospital" });
  if (!hospital) throw new Error("square.hospital@blooddrop.test is missing — cannot build golden scenario.");
  hospital.location = { type: "Point", coordinates: PANTHAPATH_HOSPITAL };
  hospital.address = "18/F West Panthapath, Dhaka 1205";
  hospital.accountStatus = "active";
  await hospital.save();
  km(`  ok hospital ${hospital.name}  ${JSON.stringify(PANTHAPATH_HOSPITAL)}`);

  // --- Patient ---
  const patient = await User.findOne({ email: "patient.demo@blooddrop.test", role: "patient" });
  if (!patient) throw new Error("patient.demo@blooddrop.test is missing — cannot build golden scenario.");
  patient.location = { type: "Point", coordinates: PANTHAPATH_PATIENT };
  patient.address = "West Panthapath, Dhaka 1205";
  patient.accountStatus = "active";
  await patient.save();
  km(`  ok patient ${patient.name}  ${JSON.stringify(PANTHAPATH_PATIENT)}`);

  // --- Donors ---
  const primary = await alignDonor({
    email: "square.donor@blooddrop.test",
    coordinates: DONOR_PRIMARY,
    address: "West Panthapath, Dhaka",
    isPrimary: true,
  });
  await alignDonor({
    email: "kurmitola.donor@blooddrop.test",
    coordinates: DONOR_BACKUP_1,
    address: "Green Road, Dhaka",
    isPrimary: false,
  });
  await alignDonor({
    email: "cmch.donor@blooddrop.test",
    coordinates: DONOR_BACKUP_2,
    address: "Kalabagan, Dhaka",
    isPrimary: false,
  });

  km("\n--- summary ---");
  km(JSON.stringify({
    hospitalId: String(hospital._id),
    hospitalCoordinates: PANTHAPATH_HOSPITAL,
    patientId: String(patient._id),
    primaryDonorUserId: primary ? String(primary.user._id) : null,
    primaryDonorProfileId: primary ? String(primary.profile._id) : null,
    goldenRequest: { bloodGroup: "O+", component: "WHOLE_BLOOD", unitsRequired: 1, urgency: "URGENT" },
  }, null, 2));

  await mongoose.disconnect();
  km("\ndone.\n");
}

main().catch(async (err) => {
  console.error("PREPARE_GOLDEN_FAILED:", err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});

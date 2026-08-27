/**
 * cleanup-golden-test-data.js
 * Removes ONLY the blood requests produced by the golden-flow test scripts
 * (matched by their exact patientNote marker) plus the notifications and
 * donations that hang off them. Nothing else is touched.
 *
 * Usage: cd backend && node scripts/cleanup-golden-test-data.js
 */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const connectDB = require("../src/config/database");
const BloodRequest = require("../src/models/BloodRequest");
const Notification = require("../src/models/Notification");
const Donation = require("../src/models/Donation");
const User = require("../src/models/User");

const MARKERS = [
  "Golden flow — Panthapath",
  "Golden flow E2E test",
];

async function main() {
  await connectDB();
  // Keep terminal ones (a FULFILLED golden run is nice demo history); only
  // sweep the half-finished requests left behind by interrupted test runs.
  const NON_TERMINAL = ["PENDING_VERIFICATION", "VERIFIED", "MATCHING", "MATCHED"];

  // The golden-flow demo patient + Square (test) hospital pair. Non-terminal
  // O+ / WHOLE_BLOOD requests between them are left-overs from interrupted
  // Playwright runs (the UI form sets no patientNote), so they are safe to sweep.
  const demoPatient = await User.findOne({ email: "patient.demo@blooddrop.test" }).select("_id").lean();
  const demoHospital = await User.findOne({ email: "square.hospital@blooddrop.test" }).select("_id").lean();

  const requests = await BloodRequest.find({
    status: { $in: NON_TERMINAL },
    $or: [
      { patientNote: { $in: MARKERS } },
      ...(demoPatient && demoHospital
        ? [{
            patient: demoPatient._id,
            hospital: demoHospital._id,
            bloodGroup: "O+",
            component: "WHOLE_BLOOD",
          }]
        : []),
    ],
  }).select("_id status patientNote").lean();
  const ids = requests.map((r) => r._id);
  console.log(`found ${ids.length} golden-flow test requests`);
  requests.forEach((r) => console.log(`  ${r._id}  ${r.status}`));

  if (ids.length === 0) { await mongoose.disconnect(); return; }

  const n = await Notification.deleteMany({ request: { $in: ids } });
  const d = await Donation.deleteMany({ request: { $in: ids } });
  const b = await BloodRequest.deleteMany({ _id: { $in: ids } });
  console.log(`deleted: ${b.deletedCount} requests, ${n.deletedCount} notifications, ${d.deletedCount} donations`);

  await mongoose.disconnect();
}
main().catch(async (e) => { console.error(e); await mongoose.disconnect().catch(() => {}); process.exit(1); });

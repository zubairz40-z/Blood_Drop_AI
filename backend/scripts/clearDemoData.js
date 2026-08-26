/**
 * clearDemoData.js — Remove ONLY demo-seeded records from the blooddrop database.
 *
 * Identifies demo records by their firebaseUid prefix ("demo-").
 * Never deletes non-demo records, drops collections, or wipes the database.
 *
 * Usage:
 *   cd backend
 *   npm run seed:demo:clear
 */

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/config/database");
const User = require("../src/models/User");
const DonorProfile = require("../src/models/DonorProfile");
const BloodRequest = require("../src/models/BloodRequest");

const DEMO_MARKER = "demo-";

async function clear() {
  await connectDB();

  console.log("\n═══════════════════════════════════════════");
  console.log("  BloodDrop AI — Demo Data Cleaner");
  console.log("═══════════════════════════════════════════\n");

  // 1. Find all demo users
  const demoUsers = await User.find({ firebaseUid: { $regex: "^" + DEMO_MARKER } }).select("_id name role firebaseUid");
  if (demoUsers.length === 0) {
    console.log("No demo users found. Nothing to clean.\n");
    await mongoose.disconnect();
    return;
  }

  const demoIds = demoUsers.map((u) => u._id);

  console.log(`Found ${demoUsers.length} demo users:`);
  for (const u of demoUsers) {
    console.log(`  • ${u.name} (${u.role}) — ${u.firebaseUid}`);
  }

  // 2. Delete donor profiles belonging to demo users
  const profilesDeleted = await DonorProfile.deleteMany({ user: { $in: demoIds } });
  console.log(`\nDeleted ${profilesDeleted.deletedCount} donor profile(s)`);

  // 3. Delete blood requests created by or for demo users
  const requestsDeleted = await BloodRequest.deleteMany({
    $or: [
      { patient: { $in: demoIds } },
      { createdBy: { $in: demoIds } },
      { hospital: { $in: demoIds } },
    ],
  });
  console.log(`Deleted ${requestsDeleted.deletedCount} blood request(s)`);

  // 4. Delete demo users
  const usersDeleted = await User.deleteMany({ firebaseUid: { $regex: "^" + DEMO_MARKER } });
  console.log(`Deleted ${usersDeleted.deletedCount} user(s)`);

  console.log("\n═══════════════════════════════════════════");
  console.log("  Clean complete!");
  console.log("═══════════════════════════════════════════\n");

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.\n");
}

clear().catch((err) => {
  console.error("\n❌ Cleanup failed:", err.message);
  console.error(err.stack);
  process.exit(1);
});

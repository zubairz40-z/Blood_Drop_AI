/**
 * clearBangladeshSeed.js — Remove ONLY Bangladesh-seeded records.
 *
 * Identifies seed records by firebaseUid prefix ("bd-").
 * Never touches non-seed records (Firebase auth users, manually created data).
 *
 * Usage:
 *   cd backend
 *   node scripts/clearBangladeshSeed.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/config/database");
const User = require("../src/models/User");
const DonorProfile = require("../src/models/DonorProfile");
const BloodRequest = require("../src/models/BloodRequest");
const Donation = require("../src/models/Donation");
const VolunteerTask = require("../src/models/VolunteerTask");
const BloodInventory = require("../src/models/BloodInventory");
const Notification = require("../src/models/Notification");

const SEED_PREFIX = "bd-";

async function clear() {
  await connectDB();

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  BloodDrop — Bangladesh Seed Cleaner");
  console.log("═══════════════════════════════════════════════════════\n");

  const seedUsers = await User.find({ firebaseUid: { $regex: `^${SEED_PREFIX}` } }).select("_id name role firebaseUid");
  if (seedUsers.length === 0) {
    console.log("No seed users found. Nothing to clean.\n");
    await mongoose.disconnect();
    return;
  }

  const seedIds = seedUsers.map(u => u._id);

  console.log(`Found ${seedUsers.length} seed users:`);
  const roleCounts = {};
  for (const u of seedUsers) {
    roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
  }
  for (const [role, count] of Object.entries(roleCounts)) {
    console.log(`  • ${role}: ${count}`);
  }

  // Delete in dependency order
  const n1 = await Notification.deleteMany({ user: { $in: seedIds } });
  console.log(`\nDeleted ${n1.deletedCount} notification(s)`);

  const n2 = await VolunteerTask.deleteMany({ hospital: { $in: seedIds } });
  console.log(`Deleted ${n2.deletedCount} volunteer task(s)`);

  const n3 = await Donation.deleteMany({ $or: [{ donor: { $in: seedIds } }, { hospital: { $in: seedIds } }] });
  console.log(`Deleted ${n3.deletedCount} donation(s)`);

  const n4 = await BloodRequest.deleteMany({ $or: [{ patient: { $in: seedIds } }, { hospital: { $in: seedIds } }, { createdBy: { $in: seedIds } }] });
  console.log(`Deleted ${n4.deletedCount} blood request(s)`);

  const n5 = await DonorProfile.deleteMany({ user: { $in: seedIds } });
  console.log(`Deleted ${n5.deletedCount} donor profile(s)`);

  const n6 = await BloodInventory.deleteMany({ hospital: { $in: seedIds } });
  console.log(`Deleted ${n6.deletedCount} inventory entry(ies)`);

  const n7 = await User.deleteMany({ firebaseUid: { $regex: `^${SEED_PREFIX}` } });
  console.log(`Deleted ${n7.deletedCount} user(s)`);

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  Bangladesh seed data cleared!");
  console.log("═══════════════════════════════════════════════════════\n");

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.\n");
}

clear().catch(err => {
  console.error("\n❌ Cleanup failed:", err.message);
  console.error(err.stack);
  process.exit(1);
});

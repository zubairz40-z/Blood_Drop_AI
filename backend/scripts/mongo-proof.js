/**
 * mongo-proof.js — prints hard DB evidence for one request as JSON.
 * Usage: node scripts/mongo-proof.js <requestId>
 */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const connectDB = require("../src/config/database");
const BloodRequest = require("../src/models/BloodRequest");
const Notification = require("../src/models/Notification");
const User = require("../src/models/User");
const DonorProfile = require("../src/models/DonorProfile");
const Donation = require("../src/models/Donation");
const BloodInventory = require("../src/models/BloodInventory");

async function main() {
  await connectDB();
  const requestId = process.argv[2];
  const req = await BloodRequest.findById(requestId).lean();
  const matchFound = await Notification.find({ request: requestId, type: "MATCH_FOUND" }).sort({ createdAt: 1 }).lean();
  const primary = matchFound[0] || null;
  const donorUser = primary ? await User.findById(primary.user).lean() : null;
  const donorProfile = donorUser ? await DonorProfile.findOne({ user: donorUser._id }).lean() : null;
  const donation = await Donation.findOne({ request: requestId }).sort({ createdAt: -1 }).lean();
  const inventory = req ? await BloodInventory.findOne({ hospital: req.hospital, bloodGroup: req.bloodGroup, component: req.component }).lean() : null;
  const hospital = req ? await User.findById(req.hospital).lean() : null;

  const out = {
    request: req && {
      _id: String(req._id), status: req.status, bloodGroup: req.bloodGroup, component: req.component,
      urgency: req.urgency, unitsRequired: req.unitsRequired, unitsFulfilled: req.unitsFulfilled,
      location: req.location, matchedDonor: req.matchedDonor ? String(req.matchedDonor) : null,
    },
    hospital: hospital && { _id: String(hospital._id), name: hospital.name, location: hospital.location },
    matchFoundCount: matchFound.length,
    matchFound: primary && {
      _id: String(primary._id), type: primary.type, recipientUserId: String(primary.user),
      request: String(primary.request), wave: primary.wave, read: primary.read,
      createdAt: primary.createdAt, expiresAt: primary.expiresAt,
      expiryValid: !!(primary.expiresAt && new Date(primary.expiresAt) > new Date(primary.createdAt)),
    },
    selectedDonor: donorUser && {
      userId: String(donorUser._id), email: donorUser.email, name: donorUser.name, role: donorUser.role,
      firebaseUid: donorUser.firebaseUid,
      donorProfileId: donorProfile ? String(donorProfile._id) : null,
      donorProfileUser: donorProfile ? String(donorProfile.user) : null,
      bloodGroup: donorProfile?.bloodGroup, isAvailable: donorProfile?.isAvailable,
      totalDonations: donorProfile?.totalDonations,
      wholeBloodEligibility: (donorProfile?.eligibility || []).find((e) => e.component === "WHOLE_BLOOD") || null,
    },
    identityAssertion: donorUser && primary && donorProfile
      ? {
          selectedDonorUserId: String(donorUser._id),
          donorProfileUser: String(donorProfile.user),
          matchFoundRecipient: String(primary.user),
          allMatch: String(donorUser._id) === String(donorProfile.user) && String(donorProfile.user) === String(primary.user),
        }
      : null,
    donation: donation && {
      _id: String(donation._id), status: donation.status, units: donation.units,
      component: donation.component, donor: String(donation.donor),
    },
    inventory: inventory && { bloodGroup: inventory.bloodGroup, component: inventory.component, units: inventory.units },
  };
  process.stdout.write("<<<PROOF_JSON>>>" + JSON.stringify(out) + "<<<END_PROOF_JSON>>>\n");
  await mongoose.disconnect();
}
main().catch(async (e) => { console.error(e); await mongoose.disconnect().catch(() => {}); process.exit(1); });

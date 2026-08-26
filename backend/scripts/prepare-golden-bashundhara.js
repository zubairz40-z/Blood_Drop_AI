/**
 * Repairs the existing live golden entities in place for the Evercare demo.
 * It does not create users, donor profiles, requests, or records in other
 * collections.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/config/database");
const User = require("../src/models/User");
const DonorProfile = require("../src/models/DonorProfile");
const BloodRequest = require("../src/models/BloodRequest");
const { Deferral } = require("../src/models/Deferral");
const { STATUS } = require("../src/utils/requestStatus");

const EVERCARE = [90.4312, 23.8103];
const PATIENT = [90.4295, 23.8120];
const DONOR = [90.4330, 23.8140];

async function main() {
  await connectDB();

  const evercare = await User.findOne({ name: "Evercare Hospital Dhaka", role: "hospital" });
  const donor = await User.findOne({ email: "zahirzubair740@gmail.com", role: "donor" });
  if (!evercare || !donor) throw new Error("Evercare or Zubair user is missing.");

  evercare.location = { type: "Point", coordinates: EVERCARE };
  evercare.address = "Plot 81, Block E, Bashundhara R/A, Dhaka 1229";
  await evercare.save();

  const profile = await DonorProfile.findOne({ user: donor._id });
  if (!profile) throw new Error("Zubair DonorProfile is missing.");

  donor.bloodGroup = "O+";
  donor.location = { type: "Point", coordinates: DONOR };
  donor.address = "Bashundhara R/A, Dhaka";
  donor.accountStatus = "active";
  await donor.save();

  profile.bloodGroup = "O+";
  profile.donationTypes = ["WHOLE_BLOOD", "PLASMA", "PLATELETS", "DOUBLE_RED_CELLS"];
  profile.location = { type: "Point", coordinates: DONOR, address: "Bashundhara R/A, Dhaka" };
  profile.isAvailable = true;
  profile.eligibility = profile.eligibility.map((entry) => ({
    ...entry.toObject(),
    lastDonationAt: null,
    nextEligibleAt: null,
    medicallyDeferredUntil: null,
  }));
  await profile.save();

  const patient = await User.findOne({ role: "patient", email: "mahir1@gmail.com" });
  if (!patient) throw new Error("Existing golden patient is missing.");
  patient.location = { type: "Point", coordinates: PATIENT };
  patient.address = "Bashundhara R/A, Dhaka";
  await patient.save();

  const request = await BloodRequest.findOne({ hospital: evercare._id }).sort({ createdAt: -1 });
  if (!request) throw new Error("Existing Evercare request is missing.");
  request.patient = patient._id;
  request.createdBy = patient._id;
  request.createdByHospital = false;
  request.bloodGroup = "O+";
  request.component = "WHOLE_BLOOD";
  request.unitsRequired = 1;
  request.unitsFulfilled = 0;
  request.urgency = "URGENT";
  request.neededBy = new Date(Date.now() + 48 * 60 * 60 * 1000);
  request.location = { type: "Point", coordinates: PATIENT, address: "Bashundhara R/A, Dhaka" };
  request.matchedDonor = undefined;
  request.matchedAt = undefined;
  request.fulfilledAt = undefined;
  request.verifiedBy = undefined;
  request.verifiedAt = undefined;
  request.status = STATUS.PENDING_VERIFICATION;
  request.statusHistory = [];
  await request.save();

  const activeDeferrals = await Deferral.countDocuments({
    donor: donor._id,
    startDate: { $lte: new Date() },
    $or: [{ type: "permanent" }, { endDate: { $gt: new Date() } }],
  });

  console.log(JSON.stringify({
    requestId: String(request._id),
    patientId: String(patient._id),
    hospitalId: String(evercare._id),
    donorId: String(donor._id),
    requestCoordinates: request.location.coordinates,
    hospitalCoordinates: evercare.location.coordinates,
    donorCoordinates: profile.location.coordinates,
    bloodGroup: profile.bloodGroup,
    isAvailable: profile.isAvailable,
    activeDeferrals,
  }, null, 2));
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(`GOLDEN_PREP_FAILED ${error.message}`);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
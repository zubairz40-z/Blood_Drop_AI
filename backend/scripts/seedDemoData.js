/**
 * seedDemoData.js — Populate the blooddrop database with realistic DEMO data.
 *
 * Seeded users CANNOT authenticate through Firebase unless matching
 * Firebase Authentication accounts exist. These are MongoDB-only records
 * for development and presentation purposes.
 *
 * Safe to run multiple times: skips records that already exist.
 *
 * Usage:
 *   cd backend
 *   npm run seed:demo
 */

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../src/config/database");
const User = require("../src/models/User");
const DonorProfile = require("../src/models/DonorProfile");
const BloodRequest = require("../src/models/BloodRequest");
const { calculateNextEligibleAt } = require("../src/utils/donationRules");
const { STATUS } = require("../src/utils/requestStatus");

// ---------------------------------------------------------------------------
// Dhaka-area coordinates [longitude, latitude]
// ---------------------------------------------------------------------------
const DHAKA = {
  gulshan:   [90.4074, 23.7925],
  banani:    [90.4023, 23.7936],
  dhanmondi: [90.3742, 23.7461],
  mirpur:    [90.3550, 23.8040],
  uttara:    [90.3995, 23.8750],
  motijheel: [90.4126, 23.7330],
  mohammadpur:[90.3615, 23.7665],
};

// ---------------------------------------------------------------------------
// Demo data definitions
// ---------------------------------------------------------------------------
const DEMO_MARKER = "demo-"; // prefix for firebaseUid — used to identify seeds

const patients = [
  {
    firebaseUid: `${DEMO_MARKER}patient-001`,
    email: "demo.patient01@blooddrop.test",
    name: "Fatima Rahman",
    role: "patient",
    phone: "01700000101",
    bloodGroup: "A+",
    accountStatus: "active",
    address: "Gulshan-1, Dhaka",
    location: { type: "Point", coordinates: DHAKA.gulshan },
  },
  {
    firebaseUid: `${DEMO_MARKER}patient-002`,
    email: "demo.patient02@blooddrop.test",
    name: "Kamal Hossain",
    role: "patient",
    phone: "01700000102",
    bloodGroup: "B+",
    accountStatus: "active",
    address: "Banani, Dhaka",
    location: { type: "Point", coordinates: DHAKA.banani },
  },
  {
    firebaseUid: `${DEMO_MARKER}patient-003`,
    email: "demo.patient03@blooddrop.test",
    name: "Nusrat Jahan",
    role: "patient",
    phone: "01700000103",
    bloodGroup: "O+",
    accountStatus: "active",
    address: "Dhanmondi, Dhaka",
    location: { type: "Point", coordinates: DHAKA.dhanmondi },
  },
  {
    firebaseUid: `${DEMO_MARKER}patient-004`,
    email: "demo.patient04@blooddrop.test",
    name: "Arif Siddiqui",
    role: "patient",
    phone: "01700000104",
    bloodGroup: "AB-",
    accountStatus: "active",
    address: "Mirpur-10, Dhaka",
    location: { type: "Point", coordinates: DHAKA.mirpur },
  },
  {
    firebaseUid: `${DEMO_MARKER}patient-005`,
    email: "demo.patient05@blooddrop.test",
    name: "Sabrina Akter",
    role: "patient",
    phone: "01700000105",
    bloodGroup: "A-",
    accountStatus: "active",
    address: "Uttara, Dhaka",
    location: { type: "Point", coordinates: DHAKA.uttara },
  },
];

const donors = [
  {
    firebaseUid: `${DEMO_MARKER}donor-001`,
    email: "demo.donor01@blooddrop.test",
    name: "Tanvir Ahmed",
    role: "donor",
    phone: "01800000201",
    bloodGroup: "O-",
    accountStatus: "active",
    address: "Gulshan-2, Dhaka",
    location: { type: "Point", coordinates: DHAKA.gulshan },
  },
  {
    firebaseUid: `${DEMO_MARKER}donor-002`,
    email: "demo.donor02@blooddrop.test",
    name: "Meghna Chowdhury",
    role: "donor",
    phone: "01800000202",
    bloodGroup: "A+",
    accountStatus: "active",
    address: "Banani, Dhaka",
    location: { type: "Point", coordinates: DHAKA.banani },
  },
  {
    firebaseUid: `${DEMO_MARKER}donor-003`,
    email: "demo.donor03@blooddrop.test",
    name: "Rakibul Hasan",
    role: "donor",
    phone: "01800000203",
    bloodGroup: "B-",
    accountStatus: "active",
    address: "Dhanmondi, Dhaka",
    location: { type: "Point", coordinates: DHAKA.dhanmondi },
  },
  {
    firebaseUid: `${DEMO_MARKER}donor-004`,
    email: "demo.donor04@blooddrop.test",
    name: "Tasnim Fariha",
    role: "donor",
    phone: "01800000204",
    bloodGroup: "AB+",
    accountStatus: "active",
    address: "Mirpur-12, Dhaka",
    location: { type: "Point", coordinates: DHAKA.mirpur },
  },
  {
    firebaseUid: `${DEMO_MARKER}donor-005`,
    email: "demo.donor05@blooddrop.test",
    name: "Sakib Chowdhury",
    role: "donor",
    phone: "01800000205",
    bloodGroup: "O+",
    accountStatus: "active",
    address: "Uttara, Dhaka",
    location: { type: "Point", coordinates: DHAKA.uttara },
  },
];

const hospitals = [
  {
    firebaseUid: `${DEMO_MARKER}hospital-001`,
    email: "demo.hospital01@blooddrop.test",
    name: "Demo General Hospital",
    role: "hospital",
    phone: "01900000301",
    accountStatus: "active",
    address: "Motijheel, Dhaka",
    location: { type: "Point", coordinates: DHAKA.motijheel },
  },
  {
    firebaseUid: `${DEMO_MARKER}hospital-002`,
    email: "demo.hospital02@blooddrop.test",
    name: "Demo Medical Center",
    role: "hospital",
    phone: "01900000302",
    accountStatus: "active",
    address: "Gulshan, Dhaka",
    location: { type: "Point", coordinates: DHAKA.gulshan },
  },
  {
    firebaseUid: `${DEMO_MARKER}hospital-003`,
    email: "demo.hospital03@blooddrop.test",
    name: "Demo City Hospital",
    role: "hospital",
    phone: "01900000303",
    accountStatus: "active",
    address: "Dhanmondi, Dhaka",
    location: { type: "Point", coordinates: DHAKA.dhanmondi },
  },
  {
    firebaseUid: `${DEMO_MARKER}hospital-004`,
    email: "demo.hospital04@blooddrop.test",
    name: "Demo Women's Hospital",
    role: "hospital",
    phone: "01900000304",
    accountStatus: "active",
    address: "Banani, Dhaka",
    location: { type: "Point", coordinates: DHAKA.banani },
  },
  // This one stays pending — useful for testing admin approval
  {
    firebaseUid: `${DEMO_MARKER}hospital-005`,
    email: "demo.hospital05@blooddrop.test",
    name: "Demo Pending Hospital",
    role: "hospital",
    phone: "01900000305",
    accountStatus: "pending",
    address: "Mohammadpur, Dhaka",
    location: { type: "Point", coordinates: DHAKA.mohammadpur },
  },
];

const volunteers = [
  {
    firebaseUid: `${DEMO_MARKER}volunteer-001`,
    email: "demo.volunteer01@blooddrop.test",
    name: "Imran Sheikh",
    role: "volunteer",
    phone: "01600000401",
    accountStatus: "active",
    address: "Gulshan, Dhaka",
    location: { type: "Point", coordinates: DHAKA.gulshan },
  },
  {
    firebaseUid: `${DEMO_MARKER}volunteer-002`,
    email: "demo.volunteer02@blooddrop.test",
    name: "Farah Noor",
    role: "volunteer",
    phone: "01600000402",
    accountStatus: "active",
    address: "Banani, Dhaka",
    location: { type: "Point", coordinates: DHAKA.banani },
  },
  {
    firebaseUid: `${DEMO_MARKER}volunteer-003`,
    email: "demo.volunteer03@blooddrop.test",
    name: "Zahidul Islam",
    role: "volunteer",
    phone: "01600000403",
    accountStatus: "active",
    address: "Uttara, Dhaka",
    location: { type: "Point", coordinates: DHAKA.uttara },
  },
  {
    firebaseUid: `${DEMO_MARKER}volunteer-004`,
    email: "demo.volunteer04@blooddrop.test",
    name: "Nafisa Rahman",
    role: "volunteer",
    phone: "01600000404",
    accountStatus: "active",
    address: "Mirpur, Dhaka",
    location: { type: "Point", coordinates: DHAKA.mirpur },
  },
  {
    firebaseUid: `${DEMO_MARKER}volunteer-005`,
    email: "demo.volunteer05@blooddrop.test",
    name: "Habib Rahman",
    role: "volunteer",
    phone: "01600000405",
    accountStatus: "active",
    address: "Dhanmondi, Dhaka",
    location: { type: "Point", coordinates: DHAKA.dhanmondi },
  },
];

const adminUser = {
  firebaseUid: `${DEMO_MARKER}admin-001`,
  email: "demo.admin01@blooddrop.test",
  name: "Demo Admin",
  role: "admin",
  phone: "01500000501",
  accountStatus: "active",
  address: "Motijheel, Dhaka",
  location: { type: "Point", coordinates: DHAKA.motijheel },
};

// Donor profiles — one per donor, referencing actual User _ids after insert
const donorProfiles = [
  // Donor 001 — O- universal donor, available, recently donated whole blood
  {
    donorIndex: 0, // index into donors array
    dateOfBirth: new Date("1992-03-15"),
    weightKg: 72,
    bloodGroup: "O-",
    donationTypes: ["WHOLE_BLOOD", "PLATELETS"],
    isAvailable: true,
    totalDonations: 5,
    eligibility: [
      {
        component: "WHOLE_BLOOD",
        lastDonationAt: new Date("2026-07-10"),
        nextEligibleAt: calculateNextEligibleAt("WHOLE_BLOOD", new Date("2026-07-10")),
        donationsThisYear: 3,
      },
      {
        component: "PLATELETS",
        lastDonationAt: new Date("2026-08-01"),
        nextEligibleAt: calculateNextEligibleAt("PLATELETS", new Date("2026-08-01")),
        donationsThisYear: 4,
      },
    ],
    location: { type: "Point", coordinates: DHAKA.gulshan, address: "Gulshan-2, Dhaka" },
  },
  // Donor 002 — A+, available, no donation history yet
  {
    donorIndex: 1,
    dateOfBirth: new Date("1995-07-22"),
    weightKg: 58,
    bloodGroup: "A+",
    donationTypes: ["WHOLE_BLOOD", "PLASMA", "PLATELETS"],
    isAvailable: true,
    totalDonations: 0,
    eligibility: [
      { component: "WHOLE_BLOOD", donationsThisYear: 0 },
      { component: "PLASMA", donationsThisYear: 0 },
      { component: "PLATELETS", donationsThisYear: 0 },
    ],
    location: { type: "Point", coordinates: DHAKA.banani, address: "Banani, Dhaka" },
  },
  // Donor 003 — B-, unavailable, medically deferred
  {
    donorIndex: 2,
    dateOfBirth: new Date("1988-11-03"),
    weightKg: 80,
    bloodGroup: "B-",
    donationTypes: ["WHOLE_BLOOD", "DOUBLE_RED_CELLS"],
    isAvailable: false,
    totalDonations: 8,
    eligibility: [
      {
        component: "WHOLE_BLOOD",
        lastDonationAt: new Date("2026-06-20"),
        nextEligibleAt: calculateNextEligibleAt("WHOLE_BLOOD", new Date("2026-06-20")),
        donationsThisYear: 4,
      },
      {
        component: "DOUBLE_RED_CELLS",
        lastDonationAt: new Date("2026-05-01"),
        nextEligibleAt: calculateNextEligibleAt("DOUBLE_RED_CELLS", new Date("2026-05-01")),
        donationsThisYear: 2,
        medicallyDeferredUntil: new Date("2026-09-30"),
        deferralReason: "Low iron levels — temporary deferral",
      },
    ],
    location: { type: "Point", coordinates: DHAKA.dhanmondi, address: "Dhanmondi, Dhaka" },
  },
  // Donor 004 — AB+, available, all components
  {
    donorIndex: 3,
    dateOfBirth: new Date("1990-01-28"),
    weightKg: 65,
    bloodGroup: "AB+",
    donationTypes: ["WHOLE_BLOOD", "PLASMA", "PLATELETS", "DOUBLE_RED_CELLS"],
    isAvailable: true,
    totalDonations: 3,
    eligibility: [
      {
        component: "WHOLE_BLOOD",
        lastDonationAt: new Date("2026-08-10"),
        nextEligibleAt: calculateNextEligibleAt("WHOLE_BLOOD", new Date("2026-08-10")),
        donationsThisYear: 2,
      },
      { component: "PLASMA", donationsThisYear: 0 },
      {
        component: "PLATELETS",
        lastDonationAt: new Date("2026-08-20"),
        nextEligibleAt: calculateNextEligibleAt("PLATELETS", new Date("2026-08-20")),
        donationsThisYear: 1,
      },
      { component: "DOUBLE_RED_CELLS", donationsThisYear: 0 },
    ],
    location: { type: "Point", coordinates: DHAKA.mirpur, address: "Mirpur-12, Dhaka" },
  },
  // Donor 005 — O+, available, plasma-only donor
  {
    donorIndex: 4,
    dateOfBirth: new Date("1998-05-10"),
    weightKg: 62,
    bloodGroup: "O+",
    donationTypes: ["PLASMA"],
    isAvailable: true,
    totalDonations: 12,
    eligibility: [
      {
        component: "PLASMA",
        lastDonationAt: new Date("2026-08-15"),
        nextEligibleAt: calculateNextEligibleAt("PLASMA", new Date("2026-08-15")),
        donationsThisYear: 18,
      },
    ],
    location: { type: "Point", coordinates: DHAKA.uttara, address: "Uttara, Dhaka" },
  },
];

// ---------------------------------------------------------------------------
// Blood requests — statuses from requestStatus.js only
// Valid statuses: PENDING_VERIFICATION, VERIFIED, REJECTED, MATCHING,
//                 MATCHED, FULFILLED, CANCELLED, EXPIRED
// ---------------------------------------------------------------------------
function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function daysAgo(n) {
  return daysFromNow(-n);
}

const bloodRequests = [
  // 1 — patient01, hospital01, PENDING_VERIFICATION (new request)
  {
    patientIndex: 0,
    hospitalIndex: 0,
    bloodGroup: "A+",
    component: "WHOLE_BLOOD",
    unitsRequired: 2,
    urgency: "URGENT",
    neededBy: daysFromNow(3),
    status: STATUS.PENDING_VERIFICATION,
    patientNote: "Scheduled surgery next week",
    statusHistory: [
      { from: null, to: STATUS.PENDING_VERIFICATION, changedBy: "patient", note: "Request created" },
    ],
  },
  // 2 — patient02, hospital02, VERIFIED
  {
    patientIndex: 1,
    hospitalIndex: 1,
    bloodGroup: "B+",
    component: "PLASMA",
    unitsRequired: 1,
    urgency: "ROUTINE",
    neededBy: daysFromNow(7),
    status: STATUS.VERIFIED,
    patientNote: "Regular transfusion",
    statusHistory: [
      { from: null, to: STATUS.PENDING_VERIFICATION, changedBy: "patient", note: "Request created" },
      { from: STATUS.PENDING_VERIFICATION, to: STATUS.VERIFIED, changedBy: "hospital", note: "Verified by hospital" },
    ],
  },
  // 3 — patient03, hospital03, REJECTED
  {
    patientIndex: 2,
    hospitalIndex: 2,
    bloodGroup: "O+",
    component: "WHOLE_BLOOD",
    unitsRequired: 3,
    urgency: "EMERGENCY",
    neededBy: daysFromNow(1),
    status: STATUS.REJECTED,
    patientNote: "Emergency — accident victim",
    rejectionReason: "Insufficient documentation provided",
    statusHistory: [
      { from: null, to: STATUS.PENDING_VERIFICATION, changedBy: "patient", note: "Request created" },
      { from: STATUS.PENDING_VERIFICATION, to: STATUS.REJECTED, changedBy: "hospital", note: "Insufficient documentation" },
    ],
  },
  // 4 — patient04, hospital01, CANCELLED by patient
  {
    patientIndex: 3,
    hospitalIndex: 0,
    bloodGroup: "AB-",
    component: "PLATELETS",
    unitsRequired: 1,
    urgency: "ROUTINE",
    neededBy: daysFromNow(10),
    status: STATUS.CANCELLED,
    patientNote: "Post-chemotherapy platelet support",
    cancellationReason: "Treatment plan changed",
    cancelledAt: daysAgo(2),
    statusHistory: [
      { from: null, to: STATUS.PENDING_VERIFICATION, changedBy: "patient", note: "Request created" },
      { from: STATUS.PENDING_VERIFICATION, to: STATUS.CANCELLED, changedBy: "patient", note: "Treatment plan changed" },
    ],
  },
  // 5 — patient05, hospital04, MATCHING (hospital verified, searching donors)
  {
    patientIndex: 4,
    hospitalIndex: 3,
    bloodGroup: "A-",
    component: "WHOLE_BLOOD",
    unitsRequired: 2,
    urgency: "URGENT",
    neededBy: daysFromNow(2),
    status: STATUS.MATCHING,
    patientNote: "Thalassemia patient needs regular transfusion",
    statusHistory: [
      { from: null, to: STATUS.PENDING_VERIFICATION, changedBy: "patient", note: "Request created" },
      { from: STATUS.PENDING_VERIFICATION, to: STATUS.VERIFIED, changedBy: "hospital", note: "Verified by hospital" },
      { from: STATUS.VERIFIED, to: STATUS.MATCHING, changedBy: "system", note: "Donor search initiated" },
    ],
  },
  // 6 — patient01, hospital02, MATCHED (donor found, awaiting acceptance)
  {
    patientIndex: 0,
    hospitalIndex: 1,
    bloodGroup: "A+",
    component: "PLATELETS",
    unitsRequired: 1,
    urgency: "EMERGENCY",
    neededBy: daysFromNow(1),
    status: STATUS.MATCHED,
    patientNote: "Critical — low platelet count",
    statusHistory: [
      { from: null, to: STATUS.PENDING_VERIFICATION, changedBy: "patient", note: "Request created" },
      { from: STATUS.PENDING_VERIFICATION, to: STATUS.VERIFIED, changedBy: "hospital", note: "Verified by hospital" },
      { from: STATUS.VERIFIED, to: STATUS.MATCHING, changedBy: "system", note: "Donor search initiated" },
      { from: STATUS.MATCHING, to: STATUS.MATCHED, changedBy: "system", note: "Compatible donor identified" },
    ],
  },
  // 7 — patient02, hospital03, FULFILLED (completed donation)
  {
    patientIndex: 1,
    hospitalIndex: 2,
    bloodGroup: "B+",
    component: "WHOLE_BLOOD",
    unitsRequired: 1,
    urgency: "ROUTINE",
    neededBy: daysAgo(14),
    status: STATUS.FULFILLED,
    fulfilledAt: daysAgo(10),
    patientNote: "Regular transfusion",
    statusHistory: [
      { from: null, to: STATUS.PENDING_VERIFICATION, changedBy: "patient", note: "Request created" },
      { from: STATUS.PENDING_VERIFICATION, to: STATUS.VERIFIED, changedBy: "hospital", note: "Verified by hospital" },
      { from: STATUS.VERIFIED, to: STATUS.MATCHING, changedBy: "system", note: "Donor search initiated" },
      { from: STATUS.MATCHING, to: STATUS.MATCHED, changedBy: "system", note: "Donor identified" },
      { from: STATUS.MATCHED, to: STATUS.FULFILLED, changedBy: "hospital", note: "Donation completed" },
    ],
  },
  // 8 — hospital01 emergency request, VERIFIED (hospital files its own)
  {
    patientIndex: null,
    hospitalIndex: 0,
    createdByHospital: true,
    patientName: "Unknown accident victim",
    patientPhone: "01700000999",
    bloodGroup: "O-",
    component: "WHOLE_BLOOD",
    unitsRequired: 4,
    urgency: "EMERGENCY",
    neededBy: daysFromNow(1),
    status: STATUS.VERIFIED,
    patientNote: "Road accident, massive blood loss",
    statusHistory: [
      { from: null, to: STATUS.VERIFIED, changedBy: "hospital", note: "Emergency request filed by hospital" },
    ],
  },
  // 9 — patient03, hospital04, EXPIRED (no donors found in time)
  {
    patientIndex: 2,
    hospitalIndex: 3,
    bloodGroup: "O+",
    component: "DOUBLE_RED_CELLS",
    unitsRequired: 2,
    urgency: "URGENT",
    neededBy: daysAgo(5),
    status: STATUS.EXPIRED,
    patientNote: "Severe anemia treatment",
    statusHistory: [
      { from: null, to: STATUS.PENDING_VERIFICATION, changedBy: "patient", note: "Request created" },
      { from: STATUS.PENDING_VERIFICATION, to: STATUS.VERIFIED, changedBy: "hospital", note: "Verified by hospital" },
      { from: STATUS.VERIFIED, to: STATUS.MATCHING, changedBy: "system", note: "Donor search initiated" },
      { from: STATUS.MATCHING, to: STATUS.EXPIRED, changedBy: "system", note: "Deadline passed — no donor matched" },
    ],
  },
  // 10 — patient05, hospital01, PENDING_VERIFICATION (another fresh request)
  {
    patientIndex: 4,
    hospitalIndex: 0,
    bloodGroup: "A-",
    component: "PLASMA",
    unitsRequired: 1,
    urgency: "ROUTINE",
    neededBy: daysFromNow(14),
    status: STATUS.PENDING_VERIFICATION,
    patientNote: "Immune disorder treatment",
    statusHistory: [
      { from: null, to: STATUS.PENDING_VERIFICATION, changedBy: "patient", note: "Request created" },
    ],
  },
  // 11 — patient01, hospital03, MATCHING
  {
    patientIndex: 0,
    hospitalIndex: 2,
    bloodGroup: "A+",
    component: "DOUBLE_RED_CELLS",
    unitsRequired: 1,
    urgency: "URGENT",
    neededBy: daysFromNow(4),
    status: STATUS.MATCHING,
    patientNote: "Double red cell donation for upcoming surgery",
    statusHistory: [
      { from: null, to: STATUS.PENDING_VERIFICATION, changedBy: "patient", note: "Request created" },
      { from: STATUS.PENDING_VERIFICATION, to: STATUS.VERIFIED, changedBy: "hospital", note: "Verified by hospital" },
      { from: STATUS.VERIFIED, to: STATUS.MATCHING, changedBy: "system", note: "Donor search initiated" },
    ],
  },
  // 12 — patient04, hospital04, VERIFIED
  {
    patientIndex: 3,
    hospitalIndex: 3,
    bloodGroup: "AB-",
    component: "WHOLE_BLOOD",
    unitsRequired: 1,
    urgency: "ROUTINE",
    neededBy: daysFromNow(5),
    status: STATUS.VERIFIED,
    patientNote: "Pre-surgical preparation",
    statusHistory: [
      { from: null, to: STATUS.PENDING_VERIFICATION, changedBy: "patient", note: "Request created" },
      { from: STATUS.PENDING_VERIFICATION, to: STATUS.VERIFIED, changedBy: "hospital", note: "Verified by hospital" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Upsert a user by firebaseUid. Returns the inserted/found document.
 * Skips if a non-demo user already has that firebaseUid (safety).
 */
async function upsertUser(data) {
  const existing = await User.findOne({ firebaseUid: data.firebaseUid });
  if (existing) {
    console.log(`  ↳ ${data.name} already exists, skipping`);
    return existing;
  }
  const doc = await User.create(data);
  console.log(`  ✔ Created ${doc.role}: ${doc.name}`);
  return doc;
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------
async function seed() {
  await connectDB();

  console.log("\n═══════════════════════════════════════════");
  console.log("  BloodDrop AI — Demo Data Seeder");
  console.log("═══════════════════════════════════════════\n");

  // --- 1. Insert users ---
  console.log("▸ Creating patients...");
  const createdPatients = [];
  for (const p of patients) {
    createdPatients.push(await upsertUser(p));
  }

  console.log("\n▸ Creating donors...");
  const createdDonors = [];
  for (const d of donors) {
    createdDonors.push(await upsertUser(d));
  }

  console.log("\n▸ Creating hospitals...");
  const createdHospitals = [];
  for (const h of hospitals) {
    createdHospitals.push(await upsertUser(h));
  }

  console.log("\n▸ Creating volunteers...");
  for (const v of volunteers) {
    await upsertUser(v);
  }

  console.log("\n▸ Creating admin...");
  await upsertUser(adminUser);

  // --- 2. Create donor profiles ---
  console.log("\n▸ Creating donor profiles...");
  for (const dp of donorProfiles) {
    const donorUser = createdDonors[dp.donorIndex];
    const existing = await DonorProfile.findOne({ user: donorUser._id });
    if (existing) {
      console.log(`  ↳ Profile for ${donorUser.name} already exists, skipping`);
      continue;
    }

    // Build eligibility — only include fields that are non-null to keep docs clean
    const eligibility = dp.eligibility.map((e) => {
      const entry = { component: e.component };
      if (e.lastDonationAt) entry.lastDonationAt = e.lastDonationAt;
      if (e.nextEligibleAt) entry.nextEligibleAt = e.nextEligibleAt;
      if (e.donationsThisYear != null) entry.donationsThisYear = e.donationsThisYear;
      if (e.medicallyDeferredUntil) entry.medicallyDeferredUntil = e.medicallyDeferredUntil;
      if (e.deferralReason) entry.deferralReason = e.deferralReason;
      return entry;
    });

    await DonorProfile.create({
      user: donorUser._id,
      dateOfBirth: dp.dateOfBirth,
      weightKg: dp.weightKg,
      bloodGroup: dp.bloodGroup,
      donationTypes: dp.donationTypes,
      eligibility,
      location: dp.location,
      isAvailable: dp.isAvailable,
      totalDonations: dp.totalDonations,
    });
    console.log(`  ✔ Created donor profile: ${donorUser.name} (${dp.bloodGroup})`);
  }

  // --- 3. Create blood requests ---
  console.log("\n▸ Creating blood requests...");

  // Check if demo requests already exist by looking for the first patient's requests
  // with our demo marker note
  const existingRequests = await BloodRequest.countDocuments({
    "statusHistory.note": { $regex: "Request created" },
    patient: { $in: createdPatients.map((p) => p._id) },
  });
  if (existingRequests >= bloodRequests.length) {
    console.log(`  ↳ ${existingRequests} demo requests already exist, skipping creation`);
  } else {
    for (let i = 0; i < bloodRequests.length; i++) {
      const req = bloodRequests[i];
      const patientUser = req.patientIndex != null ? createdPatients[req.patientIndex] : null;
      const hospitalUser = createdHospitals[req.hospitalIndex];

      // Build statusHistory, replacing "patient"/"hospital" markers with real IDs
      const statusHistory = req.statusHistory.map((sh) => {
        let changedBy;
        if (sh.changedBy === "patient") changedBy = patientUser?._id;
        else if (sh.changedBy === "hospital") changedBy = hospitalUser._id;
        else if (sh.changedBy === "system") changedBy = hospitalUser._id; // system acts as hospital context
        return {
          from: sh.from,
          to: sh.to,
          changedBy,
          note: sh.note,
        };
      });

      // Copy hospital location to the request
      const hospitalDoc = await User.findById(hospitalUser._id);
      const requestLocation = hospitalDoc?.location?.coordinates?.length === 2
        ? { type: "Point", coordinates: hospitalDoc.location.coordinates, address: hospitalDoc.address || "" }
        : undefined;

      const doc = {
        patient: patientUser?._id || undefined,
        hospital: hospitalUser._id,
        createdBy: (req.createdByHospital ? hospitalUser : patientUser)._id,
        createdByHospital: req.createdByHospital || false,
        patientName: req.patientName,
        patientPhone: req.patientPhone,
        bloodGroup: req.bloodGroup,
        component: req.component,
        unitsRequired: req.unitsRequired,
        urgency: req.urgency,
        neededBy: req.neededBy,
        status: req.status,
        location: requestLocation,
        patientNote: req.patientNote,
        statusHistory,
      };

      if (req.rejectionReason) doc.rejectionReason = req.rejectionReason;
      if (req.cancellationReason) doc.cancellationReason = req.cancellationReason;
      if (req.cancelledAt) doc.cancelledAt = req.cancelledAt;
      if (req.fulfilledAt) doc.fulfilledAt = req.fulfilledAt;
      if (req.status === STATUS.VERIFIED || req.status === STATUS.FULFILLED) {
        doc.verifiedBy = hospitalUser._id;
        doc.verifiedAt = new Date();
      }

      await BloodRequest.create(doc);
      console.log(
        `  ✔ Request ${i + 1}: ${req.bloodGroup} ${req.component} → ${req.status}`
      );
    }
  }

  // --- Summary ---
  const userCount = await User.countDocuments({ firebaseUid: { $regex: "^" + DEMO_MARKER } });
  const profileCount = await DonorProfile.countDocuments({
    user: { $in: createdDonors.map((d) => d._id) },
  });
  const requestCount = await BloodRequest.countDocuments({
    patient: { $in: createdPatients.map((p) => p._id) },
  });
  const hospitalRequestCount = await BloodRequest.countDocuments({
    createdByHospital: true,
    hospital: { $in: createdHospitals.map((h) => h._id) },
  });

  console.log("\n═══════════════════════════════════════════");
  console.log("  Seed complete!");
  console.log("═══════════════════════════════════════════");
  console.log(`  Demo users:           ${userCount}`);
  console.log(`  Donor profiles:       ${profileCount}`);
  console.log(`  Blood requests:       ${requestCount + hospitalRequestCount}`);
  console.log("═══════════════════════════════════════════\n");

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.\n");
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
seed().catch((err) => {
  console.error("\n❌ Seed failed:", err.message);
  console.error(err.stack);
  process.exit(1);
});

/**
 * seed-bangladesh.js — Bangladesh-focused seed for BloodDrop (rebalanced).
 *
 * Creates ~20 real hospitals, ~88 donors, ~90 patients, ~50 volunteers,
 * ~70 blood requests, ~50 donations, ~40 volunteer tasks, full inventory.
 *
 * Donors placed by neighborhood clusters (not per-hospital), so geographic
 * overlap is natural and coverage is realistic for a university demo.
 *
 * Deterministic: seeded PRNG produces the same data every run.
 * Idempotent: uses the "bd-" firebaseUid prefix; skips if already seeded.
 *
 * SAFE to run multiple times. Does NOT touch non-seed records.
 *
 * Usage:
 *   cd backend
 *   node scripts/seed-bangladesh.js
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

const { COMPONENT_CODES, BLOOD_GROUPS, DEFERRAL_DAYS } = require("../src/utils/donationRules");
const { STATUS } = require("../src/utils/requestStatus");

// ═══════════════════════════════════════════════════════════════════════════
// SEEDED PRNG — Linear Congruential Generator, reproducible across runs
// ═══════════════════════════════════════════════════════════════════════════
let _seed = 42;
function seedRandom(s) { _seed = s; }
function rand() {
  _seed = (_seed * 1103515245 + 12345) & 0x7fffffff;
  return _seed / 0x7fffffff;
}
function randInt(min, max) { return Math.floor(rand() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════
const SEED_PREFIX = "bd-";
const URGENCY_LEVELS = ["ROUTINE", "URGENT", "EMERGENCY"];
const TASK_TYPES = ["TRANSPORT", "GUIDE", "ESCORT"];
const TASK_STATUSES = ["OPEN", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

// Weighted blood groups: positives common, negatives rarer
const BLOOD_GROUP_WEIGHTS = [
  "O+","O+","O+","O+","O+","O+",
  "A+","A+","A+","A+",
  "B+","B+","B+","B+",
  "AB+","AB+",
  "O-","A-","B-","AB-",
  "O+","A+","B+",
];

const COMPONENT_OPTIONS = [
  ["WHOLE_BLOOD"],
  ["WHOLE_BLOOD","PLASMA"],
  ["WHOLE_BLOOD","PLATELETS"],
  ["WHOLE_BLOOD","PLASMA","PLATELETS"],
  ["PLASMA","PLATELETS"],
  ["WHOLE_BLOOD","PLASMA","PLATELETS","DOUBLE_RED_CELLS"],
  ["PLASMA"],
  ["WHOLE_BLOOD","PLATELETS","DOUBLE_RED_CELLS"],
];

// ═══════════════════════════════════════════════════════════════════════════
// FICTIONAL BANGLADESHI NAMES
// ═══════════════════════════════════════════════════════════════════════════
const FIRST_NAMES_M = [
  "Rahim","Arif","Tanvir","Sabbir","Mahmudul","Fahim","Nayeem","Faruk","Imran","Zahid",
  "Habib","Kamal","Shafiq","Rakib","Jahangir","Masud","Aminul","Belal","Sharif","Rasel",
  "Shuvo","Pranto","Nabil","Sadman","Refat","Asif","Mamun","Shakil","Monir","Karim",
  "Sohel","Badal","Jony","Rony","Sumon","Rubel","Helal","Babul","Anwar","Mizan",
  "Rimon","Sajal","Tarek","Manik","Salman","Omar","Touhid","Adnan","Siam","Hridoy",
  "Palash","Sakib","Mehedi","Raihan","Bidhan","Samir","Shihab","Nafis",
  "Abrar","Tanzir","Zayan","Ayan","Raffat","Ibtehaj","Farhan","Wasif","Nafiz",
];
const FIRST_NAMES_F = [
  "Nusrat","Sadia","Tasnim","Farzana","Nafisa","Maliha","Jannatul","Sumaiya","Aklima","Ruma",
  "Nazma","Shirin","Reshma","Shagufta","Nasima","Salma","Roksana","Monira","Jesmin","Popy",
  "Meghna","Taslima","Ananna","Suchi","Mou","Bithi","Lamia","Tanha","Eva",
  "Nandita","Sabila","Ishita","Anika","Tanzila","Farah","Bushra","Ismat","Ayesha",
  "Muskan","Rida","Zara","Lubna","Samira","Rupali","Champa","Gulshan","Beauty",
  "Asha","Koli","Runa","Lily","Sophia","Nilla","Mamata","Kusum","Sabina",
  "Laila","Nilima","Tuli","Piya","Mira","Chumki","Shapla","Lotus","Dalia","Priya",
];
const LAST_NAMES = [
  "Ahmed","Hossain","Khan","Rahman","Islam","Chowdhury","Siddiqui","Hasan","Uddin","Miah",
  "Biswas","Ali","Akter","Begum","Sheikh","Mollah","Hossen","Mondol","Das",
  "Barua","Sen","Datta","Bose","Roy","Chakma","Reza","Karim","Faruk","Salam",
  "Talukder","Hoque","Patwary","Sharker","Forkan","Rayhan","Sazal","Nayem","Rimon",
  "Jahan","Khatun","Parveen","Khatoon","Nessa","Bibi","Lipa","Rumi","Joly",
];

const AREAS_DHAKA = [
  "Bashundhara R/A","Baridhara","Nadda","Vatara","Kuril","Badda","Gulshan","Gulshan-2",
  "Banani","Niketon","Mohakhali","Khilkhet","Dhanmondi","Jigatola","Kalabagan",
  "Science Lab","Green Road","Farmgate","Tejgaon","Shahbagh","Ramna","Eskaton",
  "New Market","Azimpur","Elephant Road","Segunbagicha","Mirpur-1","Mirpur-2",
  "Mirpur-10","Mirpur-11","Pallabi","Kazipara","Shewrapara","Uttara","Airport",
  "Dakshinkhan","Uttarkhan","Cantonment","Shyamoli","Agargaon","Sher-e-Bangla Nagar",
  "Kallyanpur","Mohammadpur","Technical","Gandaria","Wari","Jatrabari","Sutrapur",
  "Tikatuli","Motijheel","Dilkusha","Lalbagh","Keraniganj",
];
const AREAS_CHATTOGRAM = [
  "Agrabad","Nasirabad","GEC Circle","Chowkbazar","Dampara","Pahartali",
  "Khulshi","Nasirabad DAO","Sat Rastar Matha","Halishahar",
];
const AREAS_SYLHET = [
  "Majestic Plaza","Zindabazar","Amberkhana","Kumarpara","Chouhatta",
  "Tilagarh","Subhanighat","Mirabazar","Airport Road","Bandarbazar",
];

// ═══════════════════════════════════════════════════════════════════════════
// HOSPITALS — loaded from verified cache (20 real Bangladesh hospitals)
// ═══════════════════════════════════════════════════════════════════════════
const hospitalsRaw = require("./data/bangladeshHospitals.json");

// ═══════════════════════════════════════════════════════════════════════════
// NEIGHBORHOOD DONOR CLUSTERS
//
// Each cluster has a name, anchor coordinates, a target donor count, and a
// city. Donors are placed deterministically within ~0.5-4 km of the anchor.
// Multiple hospitals naturally fall within range due to geographic overlap.
//
// Dhaka total: 68, Chattogram: 10, Sylhet: 10  →  88 donors.
// ═══════════════════════════════════════════════════════════════════════════
const NEIGHBORHOODS = [
  // ── Dhaka ──────────────────────────────────────────────────────────────
  { name:"Uttara",              lat:23.8700, lng:90.3920, count:5, city:"Dhaka" },
  { name:"Kurmitola/Airport",   lat:23.8350, lng:90.3980, count:5, city:"Dhaka" },
  { name:"Banani/Gulshan",      lat:23.7930, lng:90.4050, count:6, city:"Dhaka" },
  { name:"Mohakhali/Badda",     lat:23.7860, lng:90.4180, count:5, city:"Dhaka" },
  { name:"Farmgate/Tejgaon",    lat:23.7580, lng:90.3880, count:6, city:"Dhaka" },
  { name:"Dhanmondi",           lat:23.7460, lng:90.3740, count:6, city:"Dhaka" },
  { name:"Shahbagh/Eskaton",    lat:23.7380, lng:90.4010, count:5, city:"Dhaka" },
  { name:"Mirpur",              lat:23.7820, lng:90.3560, count:6, city:"Dhaka" },
  { name:"Shyamoli/Agargaon",   lat:23.7720, lng:90.3650, count:5, city:"Dhaka" },
  { name:"Old Dhaka/Gandaria",  lat:23.7190, lng:90.4150, count:5, city:"Dhaka" },
  { name:"Keraniganj South",    lat:23.6900, lng:90.4050, count:4, city:"Dhaka" },
  { name:"Uttarkhan/Dakshinkhan",lat:23.8620, lng:90.4030, count:5, city:"Dhaka" },
  { name:"Pallabi/Mirpur-11",   lat:23.7900, lng:90.3500, count:5, city:"Dhaka" },
  // ── Chattogram ─────────────────────────────────────────────────────────
  { name:"Agrabad/Chattogram",  lat:22.3475, lng:91.8250, count:4, city:"Chattogram" },
  { name:"Khulshi/GEC",         lat:22.3550, lng:91.8330, count:3, city:"Chattogram" },
  { name:"Pahartali/Halishahar",lat:22.3380, lng:91.8150, count:3, city:"Chattogram" },
  // ── Sylhet ─────────────────────────────────────────────────────────────
  { name:"Zindabazar/Sylhet",   lat:24.8930, lng:91.8720, count:4, city:"Sylhet" },
  { name:"Amberkhana/Sylhet",   lat:24.8880, lng:91.8650, count:3, city:"Sylhet" },
  { name:"Bandarbazar/Sylhet",  lat:24.8970, lng:91.8780, count:3, city:"Sylhet" },
];

// ═══════════════════════════════════════════════════════════════════════════
// GEO HELPER — deterministic point near an anchor
// ═══════════════════════════════════════════════════════════════════════════
function nearbyPoint(anchorLat, anchorLng, minKm, maxKm, rngSeed) {
  seedRandom(rngSeed);
  const angle = rand() * 2 * Math.PI;
  const distKm = minKm + rand() * (maxKm - minKm);
  const latOff = (distKm * Math.cos(angle)) / 111.32;
  const lngOff = (distKm * Math.sin(angle)) / (111.32 * Math.cos((anchorLat * Math.PI) / 180));
  return {
    lat: Math.round((anchorLat + latOff) * 10000) / 10000,
    lng: Math.round((anchorLng + lngOff) * 10000) / 10000,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// NAME GENERATION
// ═══════════════════════════════════════════════════════════════════════════
function generateName(gender) {
  const first = gender === "F" ? pick(FIRST_NAMES_F) : pick(FIRST_NAMES_M);
  const last = pick(LAST_NAMES);
  return `${first} ${last}`;
}
function generateEmail(name, idx) {
  const slug = name.toLowerCase().replace(/[^a-z]/g, ".");
  return `${slug}${String(idx).padStart(3, "0")}@seed.blooddrop.test`;
}
function generatePhone(seed) {
  seedRandom(seed);
  const prefixes = ["017","018","013","016","019","015"];
  return pick(prefixes) + String(randInt(10000000, 99999999));
}
function randomDOB(seed) {
  seedRandom(seed);
  const year = randInt(1965, 2003);
  const month = randInt(1, 12);
  const day = randInt(1, 28);
  return new Date(Date.UTC(year, month - 1, day));
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SEED
// ═══════════════════════════════════════════════════════════════════════════
async function seed() {
  await connectDB();
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  BloodDrop — Bangladesh Data Seed (rebalanced)");
  console.log("═══════════════════════════════════════════════════════\n");

  // ── Step 0: Idempotence check ──────────────────────────────────────────
  // If seed hospitals exist, skip. Developer must clear first.
  const existingHospitals = await User.countDocuments({
    firebaseUid: { $regex: `^${SEED_PREFIX}hospital` },
  });
  if (existingHospitals > 0) {
    const existingDonors = await User.countDocuments({
      firebaseUid: { $regex: `^${SEED_PREFIX}donor` },
    });
    console.log(`  ↳ ${existingHospitals} seed hospitals already exist (${existingDonors} donors).`);
    console.log("  ↳ Run: node scripts/clearBangladeshSeed.js  then re-seed.\n");
    await mongoose.disconnect();
    return;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 1. HOSPITALS (20)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("▸ Creating 20 hospitals...");
  const hospitalDocs = [];
  for (let i = 0; i < hospitalsRaw.length; i++) {
    const h = hospitalsRaw[i];
    const doc = await User.create({
      firebaseUid: `${SEED_PREFIX}hospital-${String(i + 1).padStart(3, "0")}`,
      email: `${h.name.toLowerCase().replace(/[^a-z0-9]/g, ".")}@seed.blooddrop.test`,
      name: h.name,
      role: "hospital",
      phone: generatePhone(3000 + i),
      accountStatus: "active",
      address: h.address,
      location: { type: "Point", coordinates: [h.lng, h.lat] },
    });
    hospitalDocs.push(doc);
    console.log(`  ✔ ${h.name} (${h.area}, ${h.city})`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 2. ADMIN (1)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n▸ Creating admin...");
  const adminDoc = await User.create({
    firebaseUid: `${SEED_PREFIX}admin-001`,
    email: "admin.seed@blooddrop.test",
    name: "BloodDrop Admin",
    role: "admin",
    phone: "01500000001",
    accountStatus: "active",
    address: "Motijheel, Dhaka",
    location: { type: "Point", coordinates: [90.4126, 23.7330] },
  });
  console.log("  ✔ BloodDrop Admin");

  // ═══════════════════════════════════════════════════════════════════════
  // 3. DONORS (~88) — neighborhood-based, overlapping hospital coverage
  // ═══════════════════════════════════════════════════════════════════════
  const totalDonors = NEIGHBORHOODS.reduce((s, n) => s + n.count, 0);
  console.log(`\n▸ Creating ${totalDonors} donors across ${NEIGHBORHOODS.length} neighborhoods...`);

  const allDonorDocs = [];
  const allDonorProfiles = [];
  let donorIdx = 0;

  for (const hood of NEIGHBORHOODS) {
    for (let d = 0; d < hood.count; d++) {
      donorIdx++;
      const gender = rand() > 0.45 ? "M" : "F";
      const name = generateName(gender);
      const bg = pick(BLOOD_GROUP_WEIGHTS);
      const types = pick(COMPONENT_OPTIONS);
      const dob = randomDOB(20000 + donorIdx);
      const weight = randInt(48, 95);
      const isAvailable = rand() > 0.12;
      const totalDonations = rand() < 0.35 ? randInt(1, 8) : 0;

      // Place 0.5-4 km from neighborhood anchor
      const pos = nearbyPoint(hood.lat, hood.lng, 0.5, 4, 10000 + donorIdx * 7);

      // Build eligibility: some donors recently donated (ineligible for some components)
      const eligibility = [];
      const hasHistory = totalDonations > 0 && rand() < 0.4;
      if (hasHistory) {
        const donatedComponents = shuffle(types).slice(0, randInt(1, Math.min(2, types.length)));
        for (const comp of donatedComponents) {
          const daysAgo = randInt(5, 200);
          const donatedAt = new Date(Date.now() - daysAgo * 86400000);
          const nextDays = DEFERRAL_DAYS[comp] || 56;
          const nextEligibleAt = new Date(donatedAt);
          nextEligibleAt.setDate(nextEligibleAt.getDate() + nextDays);
          eligibility.push({
            component: comp,
            lastDonationAt: donatedAt,
            nextEligibleAt,
            donationsThisYear: randInt(0, 4),
          });
        }
        for (const comp of types) {
          if (!eligibility.find(e => e.component === comp)) {
            eligibility.push({ component: comp, donationsThisYear: 0 });
          }
        }
      } else {
        for (const comp of types) {
          eligibility.push({ component: comp, donationsThisYear: 0 });
        }
      }

      // A few donors are medically deferred
      if (rand() < 0.06 && eligibility.length > 0) {
        const target = eligibility[0];
        target.medicallyDeferredUntil = new Date(Date.now() + randInt(30, 90) * 86400000);
        target.deferralReason = pick(["Low iron levels","Low hemoglobin","Recent illness","Medication adjustment"]);
      }

      const address = hood.city === "Dhaka"
        ? `${hood.name}, Dhaka`
        : `${hood.name}, ${hood.city}`;

      const userDoc = await User.create({
        firebaseUid: `${SEED_PREFIX}donor-${String(donorIdx).padStart(3, "0")}`,
        email: generateEmail(name, donorIdx),
        name,
        role: "donor",
        phone: generatePhone(10000 + donorIdx),
        bloodGroup: bg,
        accountStatus: "active",
        dateOfBirth: dob,
        address,
        location: { type: "Point", coordinates: [pos.lng, pos.lat] },
      });

      const profileDoc = await DonorProfile.create({
        user: userDoc._id,
        dateOfBirth: dob,
        weightKg: weight,
        bloodGroup: bg,
        donationTypes: types,
        eligibility,
        location: { type: "Point", coordinates: [pos.lng, pos.lat], address },
        isAvailable,
        totalDonations,
      });

      allDonorDocs.push(userDoc);
      allDonorProfiles.push(profileDoc);
    }
    const cityTag = hood.city === "Dhaka" ? "" : ` [${hood.city}]`;
    console.log(`  ✔ ${hood.name}${cityTag}: ${hood.count} donors`);
  }
  console.log(`  Total donors: ${allDonorDocs.length}`);

  // ═══════════════════════════════════════════════════════════════════════
  // 4. PATIENTS (90)
  // ═══════════════════════════════════════════════════════════════════════
  const PATIENT_TARGET = 90;
  const PATIENTS_DHAKA = 70;
  const PATIENTS_CTG = 10;
  console.log(`\n▸ Creating ${PATIENT_TARGET} patients...`);
  const patientDocs = [];
  for (let i = 0; i < PATIENT_TARGET; i++) {
    const gender = rand() > 0.45 ? "M" : "F";
    const name = generateName(gender);
    const bg = pick(BLOOD_GROUP_WEIGHTS);
    let area, clusterAnchors;
    if (i < PATIENTS_DHAKA) {
      area = pick(AREAS_DHAKA);
      clusterAnchors = NEIGHBORHOODS.filter(n => n.city === "Dhaka");
    } else if (i < PATIENTS_DHAKA + PATIENTS_CTG) {
      area = pick(AREAS_CHATTOGRAM);
      clusterAnchors = NEIGHBORHOODS.filter(n => n.city === "Chattogram");
    } else {
      area = pick(AREAS_SYLHET);
      clusterAnchors = NEIGHBORHOODS.filter(n => n.city === "Sylhet");
    }
    const anchor = pick(clusterAnchors);
    const pos = nearbyPoint(anchor.lat, anchor.lng, 0.1, 10, 50000 + i * 13);

    const doc = await User.create({
      firebaseUid: `${SEED_PREFIX}patient-${String(i + 1).padStart(3, "0")}`,
      email: generateEmail(name, i + 500),
      name,
      role: "patient",
      phone: generatePhone(20000 + i),
      bloodGroup: bg,
      accountStatus: "active",
      dateOfBirth: randomDOB(30000 + i),
      address: area,
      location: { type: "Point", coordinates: [pos.lng, pos.lat] },
    });
    patientDocs.push(doc);
  }
  console.log(`  ✔ ${patientDocs.length} patients created`);

  // ═══════════════════════════════════════════════════════════════════════
  // 5. VOLUNTEERS (50)
  // ═══════════════════════════════════════════════════════════════════════
  const VOLUNTEER_TARGET = 50;
  const VOL_DHAKA = 45;
  const VOL_CTG = 3;
  console.log(`\n▸ Creating ${VOLUNTEER_TARGET} volunteers...`);
  const volunteerDocs = [];
  for (let i = 0; i < VOLUNTEER_TARGET; i++) {
    const gender = rand() > 0.5 ? "M" : "F";
    const name = generateName(gender);
    let area, clusterAnchors;
    if (i < VOL_DHAKA) {
      area = pick(AREAS_DHAKA);
      clusterAnchors = NEIGHBORHOODS.filter(n => n.city === "Dhaka");
    } else if (i < VOL_DHAKA + VOL_CTG) {
      area = pick(AREAS_CHATTOGRAM);
      clusterAnchors = NEIGHBORHOODS.filter(n => n.city === "Chattogram");
    } else {
      area = pick(AREAS_SYLHET);
      clusterAnchors = NEIGHBORHOODS.filter(n => n.city === "Sylhet");
    }
    const anchor = pick(clusterAnchors);
    const pos = nearbyPoint(anchor.lat, anchor.lng, 0.2, 8, 70000 + i * 11);

    const doc = await User.create({
      firebaseUid: `${SEED_PREFIX}volunteer-${String(i + 1).padStart(3, "0")}`,
      email: generateEmail(name, i + 800),
      name,
      role: "volunteer",
      phone: generatePhone(30000 + i),
      accountStatus: "active",
      address: area,
      location: { type: "Point", coordinates: [pos.lng, pos.lat] },
    });
    volunteerDocs.push(doc);
  }
  console.log(`  ✔ ${volunteerDocs.length} volunteers created`);

  // ═══════════════════════════════════════════════════════════════════════
  // 6. BLOOD REQUESTS (70)
  // ═══════════════════════════════════════════════════════════════════════
  const REQUEST_TARGET = 70;
  console.log(`\n▸ Creating ${REQUEST_TARGET} blood requests...`);
  const requestDocs = [];

  // Status distribution that tells a coherent story
  const statusDistribution = [
    ...Array(12).fill(STATUS.PENDING_VERIFICATION),
    ...Array(10).fill(STATUS.VERIFIED),
    ...Array(4).fill(STATUS.REJECTED),
    ...Array(10).fill(STATUS.MATCHING),
    ...Array(6).fill(STATUS.MATCHED),
    ...Array(18).fill(STATUS.FULFILLED),
    ...Array(5).fill(STATUS.CANCELLED),
    ...Array(5).fill(STATUS.EXPIRED),
  ];
  const shuffledStatuses = shuffle(statusDistribution);

  for (let i = 0; i < REQUEST_TARGET; i++) {
    const patient = pick(patientDocs);
    const hospital = pick(hospitalDocs);
    const status = shuffledStatuses[i];
    const bg = pick(BLOOD_GROUP_WEIGHTS);
    const comp = pick(COMPONENT_CODES);
    const urgency = pick(URGENCY_LEVELS);
    const units = randInt(1, 4);

    let neededBy;
    if ([STATUS.FULFILLED, STATUS.CANCELLED, STATUS.EXPIRED, STATUS.REJECTED].includes(status)) {
      neededBy = new Date(Date.now() - randInt(5, 60) * 86400000);
    } else {
      neededBy = new Date(Date.now() + randInt(1, 14) * 86400000);
    }

    const statusHistory = [
      { from: null, to: STATUS.PENDING_VERIFICATION, changedBy: patient._id, note: "Request created" },
    ];
    if ([STATUS.VERIFIED, STATUS.MATCHING, STATUS.MATCHED, STATUS.FULFILLED].includes(status)) {
      statusHistory.push({ from: STATUS.PENDING_VERIFICATION, to: STATUS.VERIFIED, changedBy: hospital._id, note: "Verified by hospital" });
    }
    if (status === STATUS.REJECTED) {
      statusHistory.push({ from: STATUS.PENDING_VERIFICATION, to: STATUS.REJECTED, changedBy: hospital._id, note: "Insufficient documentation" });
    }
    if ([STATUS.MATCHING, STATUS.MATCHED, STATUS.FULFILLED, STATUS.EXPIRED].includes(status)) {
      statusHistory.push({ from: STATUS.VERIFIED, to: STATUS.MATCHING, changedBy: hospital._id, note: "Donor search initiated" });
    }
    if ([STATUS.MATCHED, STATUS.FULFILLED].includes(status)) {
      statusHistory.push({ from: STATUS.MATCHING, to: STATUS.MATCHED, changedBy: hospital._id, note: "Compatible donor identified" });
    }
    if (status === STATUS.FULFILLED) {
      statusHistory.push({ from: STATUS.MATCHED, to: STATUS.FULFILLED, changedBy: hospital._id, note: "Donation completed" });
    }
    if (status === STATUS.EXPIRED) {
      statusHistory.push({ from: STATUS.MATCHING, to: STATUS.EXPIRED, changedBy: hospital._id, note: "Deadline passed" });
    }
    if (status === STATUS.CANCELLED) {
      statusHistory.push({ from: STATUS.PENDING_VERIFICATION, to: STATUS.CANCELLED, changedBy: patient._id, note: "Cancelled by patient" });
    }

    const hospitalLocation = hospital.location;

    const doc = await BloodRequest.create({
      patient: patient._id,
      hospital: hospital._id,
      createdBy: patient._id,
      bloodGroup: bg,
      component: comp,
      unitsRequired: units,
      urgency,
      neededBy,
      status,
      location: hospitalLocation ? { type: "Point", coordinates: [...hospitalLocation.coordinates] } : undefined,
      patientNote: pick([
        "Scheduled surgery","Regular transfusion needed","Emergency — accident",
        "Post-chemotherapy support","Thalassemia treatment","Anemia treatment",
        "Road accident victim","Maternal complication","Burn treatment",
        "Post-operative recovery","Dengue fever complications","Pre-surgical preparation",
      ]),
      statusHistory,
      ...(status === STATUS.REJECTED ? { rejectionReason: "Insufficient documentation provided", verifiedBy: hospital._id } : {}),
      ...(status === STATUS.CANCELLED ? { cancelledAt: new Date(Date.now() - randInt(1, 10) * 86400000), cancellationReason: "Treatment plan changed" } : {}),
      ...(status === STATUS.FULFILLED ? { fulfilledAt: new Date(Date.now() - randInt(1, 30) * 86400000), verifiedBy: hospital._id, unitsFulfilled: units } : {}),
      ...(status === STATUS.VERIFIED ? { verifiedBy: hospital._id, verifiedAt: new Date() } : {}),
    });
    requestDocs.push(doc);
  }
  console.log(`  ✔ ${requestDocs.length} blood requests created`);

  // ═══════════════════════════════════════════════════════════════════════
  // 7. DONATIONS (50)
  // ═══════════════════════════════════════════════════════════════════════
  const fulfilledRequests = requestDocs.filter(r => r.status === STATUS.FULFILLED);
  const matchedRequests = requestDocs.filter(r => r.status === STATUS.MATCHED);
  console.log(`\n▸ Creating donations (target ~50)...`);
  const donationDocs = [];

  // Confirmed donations for FULFILLED requests
  for (let i = 0; i < Math.min(fulfilledRequests.length, 38); i++) {
    const req = fulfilledRequests[i];
    const donor = pick(allDonorDocs);
    const donatedAt = req.fulfilledAt || new Date(Date.now() - randInt(5, 45) * 86400000);
    const doc = await Donation.create({
      donor: donor._id,
      request: req._id,
      hospital: req.hospital,
      component: req.component,
      units: req.unitsRequired,
      status: "CONFIRMED",
      donatedAt,
      confirmedAt: new Date(donatedAt.getTime() + 3600000),
      confirmedBy: req.hospital,
    });
    donationDocs.push(doc);
  }

  // Pending donations for MATCHED requests
  for (let i = 0; i < Math.min(matchedRequests.length, 6); i++) {
    const req = matchedRequests[i];
    const donor = pick(allDonorDocs);
    const doc = await Donation.create({
      donor: donor._id,
      request: req._id,
      hospital: req.hospital,
      component: req.component,
      units: req.unitsRequired,
      status: "PENDING",
      donatedAt: new Date(),
    });
    donationDocs.push(doc);
  }

  // Historical donations for variety
  for (let i = 0; i < 6; i++) {
    const donor = pick(allDonorDocs);
    const hospital = pick(hospitalDocs);
    const histStatus = pick(["CONFIRMED", "CANCELLED"]);
    const doc = await Donation.create({
      donor: donor._id,
      request: pick(requestDocs)._id,
      hospital: hospital._id,
      component: pick(COMPONENT_CODES),
      units: randInt(1, 2),
      status: histStatus,
      donatedAt: new Date(Date.now() - randInt(30, 365) * 86400000),
      ...(histStatus === "CONFIRMED" ? { confirmedAt: new Date(), confirmedBy: hospital._id } : { cancelledAt: new Date(), cancellationReason: "Donor unavailable" }),
    });
    donationDocs.push(doc);
  }
  console.log(`  ✔ ${donationDocs.length} donations created`);

  // ═══════════════════════════════════════════════════════════════════════
  // 8. VOLUNTEER TASKS (40)
  // ═══════════════════════════════════════════════════════════════════════
  const TASK_TARGET = 40;
  console.log(`\n▸ Creating ${TASK_TARGET} volunteer tasks...`);
  const taskDocs = [];
  for (let i = 0; i < TASK_TARGET; i++) {
    const req = pick(requestDocs);
    const hospital = pick(hospitalDocs);
    const volunteer = pick(volunteerDocs);
    const taskStatus = pick(TASK_STATUSES);
    const taskType = pick(TASK_TYPES);
    const urgency = pick(URGENCY_LEVELS);

    const task = await VolunteerTask.create({
      request: req._id,
      volunteer: taskStatus !== "OPEN" ? volunteer._id : undefined,
      hospital: hospital._id,
      title: `${taskType} support for ${req.bloodGroup} ${req.component} donation`,
      description: pick([
        "Transport donor to hospital",
        "Guide donor through hospital procedures",
        "Escort donor during donation process",
        "Provide coordination assistance at hospital",
        "Support patient transfer logistics",
      ]),
      type: taskType,
      status: taskStatus,
      urgency,
      address: hospital.address || "Dhaka, Bangladesh",
      ...(taskStatus !== "OPEN" ? { assignedAt: new Date(Date.now() - randInt(1, 5) * 86400000) } : {}),
      ...(taskStatus === "IN_PROGRESS" ? { startedAt: new Date(Date.now() - randInt(1, 3) * 86400000) } : {}),
      ...(taskStatus === "COMPLETED" ? { completedAt: new Date(Date.now() - randInt(1, 7) * 86400000) } : {}),
    });
    taskDocs.push(task);
  }
  console.log(`  ✔ ${taskDocs.length} volunteer tasks created`);

  // ═══════════════════════════════════════════════════════════════════════
  // 9. INVENTORY — full 32 rows per hospital (8 blood groups × 4 components)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n▸ Creating inventory for 20 hospitals...");
  let inventoryCount = 0;
  for (const hospital of hospitalDocs) {
    const ops = [];
    for (const bg of BLOOD_GROUPS) {
      for (const comp of COMPONENT_CODES) {
        let units;
        const stockRoll = rand();
        if (stockRoll < 0.15) units = 0;
        else if (stockRoll < 0.35) units = randInt(1, 3);
        else if (stockRoll < 0.70) units = randInt(4, 12);
        else units = randInt(13, 25);
        ops.push({
          updateOne: {
            filter: { hospital: hospital._id, bloodGroup: bg, component: comp },
            update: { $set: { units, updatedBy: adminDoc._id } },
            upsert: true,
          },
        });
      }
    }
    await BloodInventory.bulkWrite(ops);
    inventoryCount += BLOOD_GROUPS.length * COMPONENT_CODES.length;
  }
  console.log(`  ✔ ${inventoryCount} inventory entries created`);

  // ═══════════════════════════════════════════════════════════════════════
  // 10. NOTIFICATIONS — historical, referencing valid records
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n▸ Creating notifications...");
  let notifCount = 0;
  for (const req of fulfilledRequests.slice(0, 12)) {
    await Notification.create({
      user: req.patient,
      type: "REQUEST_FULFILLED",
      title: "Request Fulfilled",
      message: `Your ${req.bloodGroup} ${req.component} request has been fulfilled.`,
      read: true,
      request: req._id,
    });
    notifCount++;
  }
  for (const req of matchedRequests.slice(0, 5)) {
    await Notification.create({
      user: req.patient,
      type: "MATCH_FOUND",
      title: "Donor Matched",
      message: `A compatible donor has been found for your ${req.bloodGroup} ${req.component} request.`,
      read: false,
      request: req._id,
    });
    notifCount++;
  }
  const verifiedRequests = requestDocs.filter(r => r.status === STATUS.VERIFIED);
  for (const req of verifiedRequests.slice(0, 6)) {
    await Notification.create({
      user: req.patient,
      type: "REQUEST_VERIFIED",
      title: "Request Verified",
      message: `Your ${req.bloodGroup} ${req.component} request has been verified by the hospital.`,
      read: true,
      request: req._id,
    });
    notifCount++;
  }
  console.log(`  ✔ ${notifCount} notifications created`);

  // ═══════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════
  const counts = {
    hospitals: await User.countDocuments({ firebaseUid: { $regex: `^${SEED_PREFIX}hospital` } }),
    donors: await User.countDocuments({ firebaseUid: { $regex: `^${SEED_PREFIX}donor` } }),
    patients: await User.countDocuments({ firebaseUid: { $regex: `^${SEED_PREFIX}patient` } }),
    volunteers: await User.countDocuments({ firebaseUid: { $regex: `^${SEED_PREFIX}volunteer` } }),
    admin: await User.countDocuments({ firebaseUid: { $regex: `^${SEED_PREFIX}admin` } }),
    donorProfiles: await DonorProfile.countDocuments(),
    requests: await BloodRequest.countDocuments(),
    donations: await Donation.countDocuments(),
    tasks: await VolunteerTask.countDocuments(),
    inventory: await BloodInventory.countDocuments(),
    notifications: await Notification.countDocuments(),
  };

  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  Seed Complete!");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Hospitals:           ${counts.hospitals}`);
  console.log(`  Donors:              ${counts.donors}`);
  console.log(`  Patients:            ${counts.patients}`);
  console.log(`  Volunteers:          ${counts.volunteers}`);
  console.log(`  Admin:               ${counts.admin}`);
  console.log(`  Donor Profiles:      ${counts.donorProfiles}`);
  console.log(`  Blood Requests:      ${counts.requests}`);
  console.log(`  Donations:           ${counts.donations}`);
  console.log(`  Volunteer Tasks:     ${counts.tasks}`);
  console.log(`  Inventory Entries:   ${counts.inventory}`);
  console.log(`  Notifications:       ${counts.notifications}`);
  console.log("═══════════════════════════════════════════════════════\n");

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.\n");
}

seed().catch((err) => {
  console.error("\n❌ Seed failed:", err.message);
  console.error(err.stack);
  process.exit(1);
});

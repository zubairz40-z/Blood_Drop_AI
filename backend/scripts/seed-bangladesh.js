/**
 * seed-bangladesh.js — Comprehensive Bangladesh-focused seed for BloodDrop.
 *
 * Creates ~20 real hospitals, ~210 donors, ~120 patients, ~80 volunteers,
 * ~100 blood requests, ~70 donations, ~50 volunteer tasks, full inventory.
 *
 * Deterministic: uses a seeded PRNG so every run produces the same data.
 * Idempotent: uses the "bd-" firebaseUid prefix; skips existing records.
 *
 * SAFE to run multiple times. Does NOT touch non-seed records.
 *
 * Usage:
 *   cd backend
 *   node scripts/seed-bangladesh.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");
const connectDB = require("../src/config/database");

// ── Models ─────────────────────────────────────────────────────────────────
const User = require("../src/models/User");
const DonorProfile = require("../src/models/DonorProfile");
const BloodRequest = require("../src/models/BloodRequest");
const Donation = require("../src/models/Donation");
const VolunteerTask = require("../src/models/VolunteerTask");
const BloodInventory = require("../src/models/BloodInventory");
const Notification = require("../src/models/Notification");

// ── Utilities ──────────────────────────────────────────────────────────────
const { COMPONENT_CODES, BLOOD_GROUPS, DEFERRAL_DAYS, ANNUAL_LIMIT } = require("../src/utils/donationRules");
const { STATUS } = require("../src/utils/requestStatus");
const { haversineDistance } = require("../src/utils/geoValidation");

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
const SEED_MARKER = "seeded";

const URGENCY_LEVELS = ["ROUTINE", "URGENT", "EMERGENCY"];
const TASK_TYPES = ["TRANSPORT", "GUIDE", "ESCORT"];
const TASK_STATUSES = ["OPEN", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

// ═══════════════════════════════════════════════════════════════════════════
// FICTIONAL BANGLADESHI NAMES
// ═══════════════════════════════════════════════════════════════════════════
const FIRST_NAMES_M = [
  "Rahim","Arif","Tanvir","Sabbir","Mahmudul","Fahim","Nayeem","Faruk","Imran","Zahid",
  "Habib","Kamal","Shafiq","Rakib","Jahangir","Masud","Aminul","Belal","Sharif","Rasel",
  "Shuvo","Pranto","Nabil","Sadman","Refat","Asif","Mamun","Shakil","Monir","Karim",
  "Sohel","Badal","Jony","Rony","Sumon","Rubel","Helal","Babul","Anwar","Mizan",
  "Rimon","Sajal","Tarek","Manik","Salman","Omar","Touhid","Adnan","Siam","Hridoy",
  "Palash","Sakib","Mehedi","Sakib","Raihan","Bidhan","Samir","Alvee","Shihab","Nafis",
  "Abrar","Tanzir","Zayan","Ayan","Raffat","Ibtehaj","Asif","Farhan","Wasif","Nafiz",
];

const FIRST_NAMES_F = [
  "Nusrat","Sadia","Tasnim","Farzana","Nafisa","Maliha","Jannatul","Sumaiya","Aklima","Ruma",
  "Nazma","Shirin","Reshma","Shagufta","Nasima","Salma","Roksana","Monira","Jesmin","Popy",
  "Meghna","Taslima","Ananna","Suchi","Mou","Bithi","Ruma","Lamia","Tanha","Eva",
  "Nandita","Porimoni","Sabila","Ishita","Anika","Tanzila","Farah","Bushra","Ismat","Ayesha",
  "Muskan","Rida","Zara","Anika","Lubna","Samira","Rupali","Champa","Gulshan","Beauty",
  "Asha","Koli","Runa","Lily","Ruma","Sophia","Nilla","Mamata","Kusum","Sabina",
  "Laila","Nilima","Tuli","Piya","Mira","Chumki","Shapla","Lotus","Dalia","Priya",
];

const LAST_NAMES = [
  "Ahmed","Hossain","Khan","Rahman","Islam","Chowdhury","Siddiqui","Hasan","Uddin","Miah",
  "Biswas","Ali","Akter","Begum","Sheikh","Mollah","Hossen","Mondol","Gomez","Das",
  "Barua","Sen","Datta","Bose","Roy","Chakma","Reza","Karim","Faruk","Salam",
  "Talukder","Hoque","Patwary","Sharker","Forkan","Rayhan","Sazal","Shuvo","Nayem","Rimon",
  "Jahan","Khatun","Parveen","Khatoon","Nessa","Bibi"," Ara","Lipa","Rumi","Joly",
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

const AREAS_OUTSIDE = [
  "Agrabad, Chattogram","Nasirabad, Chattogram","GEC Circle, Chattogram",
  "Majestic Plaza, Sylhet","Zindabazar, Sylhet","Amberkhana, Sylhet",
];

// ═══════════════════════════════════════════════════════════════════════════
// HOSPITALS — loaded from verified cache
// ═══════════════════════════════════════════════════════════════════════════
const hospitalsRaw = require("./data/bangladeshHospitals.json");

// ═══════════════════════════════════════════════════════════════════════════
// NEIGHBORHOOD ANCHOR CLUSTERS — each hospital has nearby neighborhoods
// ═══════════════════════════════════════════════════════════════════════════
const CLUSTERS = [
  { hospitalIdx: 0,  anchors: [
    { name:"Bashundhara", lat:23.8160, lng:90.4370 },
    { name:"Baridhara",  lat:23.8140, lng:90.4280 },
    { name:"Nadda",      lat:23.8070, lng:90.4430 },
    { name:"Vatara",     lat:23.8050, lng:90.4300 },
    { name:"Kuril",      lat:23.7980, lng:90.4380 },
  ]},
  { hospitalIdx: 1,  anchors: [
    { name:"Panthapath",  lat:23.7580, lng:90.3830 },
    { name:"Green Road",  lat:23.7530, lng:90.3760 },
    { name:"Farmgate",    lat:23.7580, lng:90.3870 },
    { name:"Tejgaon",     lat:23.7530, lng:90.3920 },
    { name:"Kalabagan",   lat:23.7450, lng:90.3720 },
  ]},
  { hospitalIdx: 2,  anchors: [
    { name:"Gulshan-1",  lat:23.7920, lng:90.4050 },
    { name:"Gulshan-2",  lat:23.7940, lng:90.4100 },
    { name:"Banani",     lat:23.7940, lng:90.4020 },
    { name:"Niketon",    lat:23.7890, lng:90.4080 },
    { name:"Mohakhali",  lat:23.7830, lng:90.4030 },
  ]},
  { hospitalIdx: 3,  anchors: [
    { name:"Dhanmondi",  lat:23.7470, lng:90.3740 },
    { name:"Jigatola",   lat:23.7410, lng:90.3700 },
    { name:"Science Lab",lat:23.7390, lng:90.3690 },
    { name:"Kalabagan",  lat:23.7440, lng:90.3720 },
    { name:"Mohammadpur",lat:23.7670, lng:90.3620 },
  ]},
  { hospitalIdx: 4,  anchors: [
    { name:"Dhanmondi",  lat:23.7410, lng:90.3730 },
    { name:"Jigatola",   lat:23.7400, lng:90.3680 },
    { name:"Science Lab",lat:23.7370, lng:90.3710 },
    { name:"New Market", lat:23.7380, lng:90.3700 },
  ]},
  { hospitalIdx: 5,  anchors: [
    { name:"Dhanmondi",  lat:23.7510, lng:90.3710 },
    { name:"Green Road", lat:23.7520, lng:90.3750 },
    { name:"Elephant Road", lat:23.7360, lng:90.3790 },
  ]},
  { hospitalIdx: 6,  anchors: [
    { name:"Shyamoli",   lat:23.7700, lng:90.3580 },
    { name:"Agargaon",   lat:23.7750, lng:90.3730 },
    { name:"Kallyanpur", lat:23.7750, lng:90.3650 },
    { name:"Mohammadpur",lat:23.7660, lng:90.3610 },
    { name:"Technical",  lat:23.7600, lng:90.3560 },
  ]},
  { hospitalIdx: 7,  anchors: [
    { name:"Green Road",  lat:23.7540, lng:90.3880 },
    { name:"Farmgate",    lat:23.7570, lng:90.3870 },
    { name:"Panthapath",  lat:23.7590, lng:90.3820 },
    { name:"Tejgaon",     lat:23.7530, lng:90.3910 },
  ]},
  { hospitalIdx: 8,  anchors: [
    { name:"Dhanmondi",  lat:23.7480, lng:90.3760 },
    { name:"Jigatola",   lat:23.7430, lng:90.3720 },
    { name:"Kalabagan",  lat:23.7450, lng:90.3740 },
  ]},
  { hospitalIdx: 9,  anchors: [
    { name:"Eskaton",     lat:23.7390, lng:90.4070 },
    { name:"Ramna",       lat:23.7410, lng:90.4000 },
    { name:"Segunbagicha",lat:23.7370, lng:90.4040 },
    { name:"Motijheel",   lat:23.7340, lng:90.4110 },
  ]},
  { hospitalIdx: 10, anchors: [
    { name:"Shahbagh",     lat:23.7340, lng:90.3930 },
    { name:"New Market",   lat:23.7380, lng:90.3710 },
    { name:"Azimpur",      lat:23.7310, lng:90.3900 },
    { name:"Elephant Road",lat:23.7370, lng:90.3810 },
  ]},
  { hospitalIdx: 11, anchors: [
    { name:"Kurmitola",    lat:23.8280, lng:90.3970 },
    { name:"Airport",      lat:23.8450, lng:90.4000 },
    { name:"Cantonment",   lat:23.8200, lng:90.3950 },
    { name:"Khilkhet",     lat:23.8150, lng:90.4130 },
  ]},
  { hospitalIdx: 12, anchors: [
    { name:"Shahbagh",     lat:23.7360, lng:90.3940 },
    { name:"Ramna",        lat:23.7390, lng:90.3970 },
    { name:"Eskaton",      lat:23.7380, lng:90.4060 },
    { name:"New Market",   lat:23.7380, lng:90.3720 },
  ]},
  { hospitalIdx: 13, anchors: [
    { name:"Mirpur-10",    lat:23.7820, lng:90.3560 },
    { name:"Mirpur-11",    lat:23.7840, lng:90.3530 },
    { name:"Mirpur-2",     lat:23.7880, lng:90.3580 },
    { name:"Pallabi",      lat:23.7900, lng:90.3500 },
    { name:"Kazipara",     lat:23.7810, lng:90.3600 },
    { name:"Shewrapara",   lat:23.7800, lng:90.3630 },
  ]},
  { hospitalIdx: 14, anchors: [
    { name:"Uttara",       lat:23.8700, lng:90.3920 },
    { name:"Dakshinkhan",  lat:23.8600, lng:90.4000 },
    { name:"Uttarkhan",    lat:23.8750, lng:90.3850 },
    { name:"Airport",      lat:23.8500, lng:90.3980 },
  ]},
  { hospitalIdx: 15, anchors: [
    { name:"Gandaria",     lat:23.7170, lng:90.4160 },
    { name:"Wari",         lat:23.7200, lng:90.4200 },
    { name:"Jatrabari",    lat:23.7100, lng:90.4250 },
    { name:"Sutrapur",     lat:23.7150, lng:90.4180 },
    { name:"Tikatuli",     lat:23.7180, lng:90.4130 },
  ]},
  { hospitalIdx: 16, anchors: [
    { name:"Sher-e-Bangla Nagar", lat:23.7720, lng:90.3690 },
    { name:"Agargaon",     lat:23.7750, lng:90.3720 },
    { name:"Shyamoli",     lat:23.7700, lng:90.3590 },
  ]},
  { hospitalIdx: 17, anchors: [
    { name:"Agargaon",     lat:23.7750, lng:90.3730 },
    { name:"Sher-e-Bangla Nagar", lat:23.7720, lng:90.3700 },
    { name:"Shyamoli",     lat:23.7690, lng:90.3600 },
    { name:"Kallyanpur",   lat:23.7740, lng:90.3660 },
  ]},
  { hospitalIdx: 18, anchors: [
    { name:"Agrabad",      lat:22.3470, lng:91.8250 },
    { name:"Nasirabad",    lat:22.3500, lng:91.8200 },
    { name:"GEC Circle",   lat:22.3430, lng:91.8300 },
  ]},
  { hospitalIdx: 19, anchors: [
    { name:"Majestic Plaza", lat:24.8940, lng:91.8700 },
    { name:"Zindabazar",   lat:24.8920, lng:91.8730 },
    { name:"Amberkhana",   lat:24.8890, lng:91.8650 },
  ]},
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
  const year = randInt(1960, 2005);
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
  console.log("  BloodDrop — Bangladesh Data Seed");
  console.log("═══════════════════════════════════════════════════════\n");

  // ── Step 0: Check if already seeded ────────────────────────────────────
  const existingHospitals = await User.countDocuments({ firebaseUid: { $regex: `^${SEED_PREFIX}hospital` } });
  if (existingHospitals > 0) {
    console.log(`  ↳ ${existingHospitals} seed hospitals already exist. Clear first with clearBangladeshSeed.js`);
    console.log("  ↳ Skipping seed. Run the clear script first if you want a fresh seed.\n");
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
  // 3. DONORS (210) — distributed across clusters
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n▸ Creating ~210 donors across 9 Dhaka clusters + 2 outside...");

  const bloodGroupWeights = [
    "O+","O+","O+","O+","O+","O+",  // 30%
    "A+","A+","A+","A+",            // 20%
    "B+","B+","B+","B+",            // 20%
    "AB+","AB+",                     // 10%
    "O-","A-","B-","AB-",           // 10% negatives
    "O+","A+","B+",                 // 10% extra positives
  ];

  const componentOptions = [
    ["WHOLE_BLOOD"],
    ["WHOLE_BLOOD","PLASMA"],
    ["WHOLE_BLOOD","PLATELETS"],
    ["WHOLE_BLOOD","PLASMA","PLATELETS"],
    ["PLASMA","PLATELETS"],
    ["WHOLE_BLOOD","PLASMA","PLATELETS","DOUBLE_RED_CELLS"],
    ["PLASMA"],
    ["WHOLE_BLOOD","PLATELETS","DOUBLE_RED_CELLS"],
  ];

  // Per-cluster donor counts (sum ~210)
  const clusterDonorCounts = [22,22,22,32,22,22,26,26,18,10,10]; // last 2 are outside

  const allDonorDocs = [];
  const allDonorProfiles = [];
  let donorIdx = 0;

  for (let c = 0; c < CLUSTERS.length; c++) {
    const cluster = CLUSTERS[c];
    const count = clusterDonorCounts[c] || 10;

    for (let d = 0; d < count; d++) {
      donorIdx++;
      const gender = rand() > 0.45 ? "M" : "F";
      const name = generateName(gender);
      const anchor = pick(cluster.anchors);
      const distBand = rand();
      // Distribution: 40% within 2km, 30% 2-4km, 20% 4-7km, 10% 7-12km
      let minKm, maxKm;
      if (distBand < 0.40) { minKm = 0.3; maxKm = 2; }
      else if (distBand < 0.70) { minKm = 2; maxKm = 4; }
      else if (distBand < 0.90) { minKm = 4; maxKm = 7; }
      else { minKm = 7; maxKm = 12; }

      const pos = nearbyPoint(anchor.lat, anchor.lng, minKm, maxKm, 10000 + donorIdx * 7);
      const bg = pick(bloodGroupWeights);
      const dob = randomDOB(20000 + donorIdx);
      const weight = randInt(48, 95);
      const types = pick(componentOptions);
      const isAvailable = rand() > 0.12; // 88% available

      // Some donors have eligibility history (recently donated), some are fresh
      const hasHistory = rand() < 0.35;
      const eligibility = [];

      if (hasHistory) {
        // Pick 1-2 components they donated recently
        const donatedComponents = shuffle(types).slice(0, randInt(1, Math.min(2, types.length)));
        for (const comp of donatedComponents) {
          const daysAgo = randInt(5, 300);
          const donatedAt = new Date(Date.now() - daysAgo * 86400000);
          const nextDays = DEFERRAL_DAYS[comp] || 56;
          const nextEligibleAt = new Date(donatedAt);
          nextEligibleAt.setDate(nextEligibleAt.getDate() + nextDays);
          eligibility.push({
            component: comp,
            lastDonationAt: donatedAt,
            nextEligibleAt: nextEligibleAt,
            donationsThisYear: randInt(0, 4),
          });
        }
        // Add entries for other components with 0 history
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

      // Some donors are medically deferred
      const isMedicallyDeferred = rand() < 0.05;
      if (isMedicallyDeferred && eligibility.length > 0) {
        const target = eligibility[0];
        const until = new Date(Date.now() + randInt(30, 90) * 86400000);
        target.medicallyDeferredUntil = until;
        target.deferralReason = pick(["Low iron levels","Low hemoglobin","Recent illness","Medication adjustment"]);
      }

      const totalDonations = hasHistory ? randInt(1, 12) : 0;

      // Create user
      const userDoc = await User.create({
        firebaseUid: `${SEED_PREFIX}donor-${String(donorIdx).padStart(3, "0")}`,
        email: generateEmail(name, donorIdx),
        name,
        role: "donor",
        phone: generatePhone(10000 + donorIdx),
        bloodGroup: bg,
        accountStatus: "active",
        dateOfBirth: dob,
        address: `${anchor.name}, Dhaka`,
        location: { type: "Point", coordinates: [pos.lng, pos.lat] },
      });

      // Create donor profile
      const profileDoc = await DonorProfile.create({
        user: userDoc._id,
        dateOfBirth: dob,
        weightKg: weight,
        bloodGroup: bg,
        donationTypes: types,
        eligibility,
        location: { type: "Point", coordinates: [pos.lng, pos.lat], address: `${anchor.name}, Dhaka` },
        isAvailable,
        totalDonations,
      });

      allDonorDocs.push(userDoc);
      allDonorProfiles.push(profileDoc);
    }
    console.log(`  ✔ Cluster ${c + 1}: ${count} donors (${cluster.anchors[0].name})`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 4. PATIENTS (120)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n▸ Creating 120 patients...");
  const patientDocs = [];
  for (let i = 0; i < 120; i++) {
    const gender = rand() > 0.45 ? "M" : "F";
    const name = generateName(gender);
    const area = i < 110 ? pick(AREAS_DHAKA) : pick(AREAS_OUTSIDE);
    const bg = pick(bloodGroupWeights);

    // Generate position near a random cluster anchor
    const clusterAnchors = CLUSTERS.slice(0, 18).flatMap(c => c.anchors);
    const anchor = pick(clusterAnchors);
    const pos = nearbyPoint(anchor.lat, anchor.lng, 0.1, 15, 50000 + i * 13);

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
  // 5. VOLUNTEERS (80)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n▸ Creating 80 volunteers...");
  const volunteerDocs = [];
  for (let i = 0; i < 80; i++) {
    const gender = rand() > 0.5 ? "M" : "F";
    const name = generateName(gender);
    const area = i < 75 ? pick(AREAS_DHAKA) : pick(AREAS_OUTSIDE);
    const clusterAnchors = CLUSTERS.slice(0, 18).flatMap(c => c.anchors);
    const anchor = pick(clusterAnchors);
    const pos = nearbyPoint(anchor.lat, anchor.lng, 0.2, 10, 70000 + i * 11);

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
  // 6. BLOOD REQUESTS (100)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n▸ Creating 100 blood requests...");
  const requestDocs = [];

  // Status distribution: 20 PENDING, 15 VERIFIED, 5 REJECTED, 15 MATCHING, 10 MATCHED, 25 FULFILLED, 5 CANCELLED, 5 EXPIRED
  const statusDistribution = [
    ...Array(20).fill(STATUS.PENDING_VERIFICATION),
    ...Array(15).fill(STATUS.VERIFIED),
    ...Array(5).fill(STATUS.REJECTED),
    ...Array(15).fill(STATUS.MATCHING),
    ...Array(10).fill(STATUS.MATCHED),
    ...Array(25).fill(STATUS.FULFILLED),
    ...Array(5).fill(STATUS.CANCELLED),
    ...Array(5).fill(STATUS.EXPIRED),
  ];
  const shuffledStatuses = shuffle(statusDistribution);

  for (let i = 0; i < 100; i++) {
    const patient = pick(patientDocs);
    const hospital = pick(hospitalDocs);
    const status = shuffledStatuses[i];
    const bg = pick(bloodGroupWeights);
    const comp = pick(COMPONENT_CODES);
    const urgency = pick(URGENCY_LEVELS);
    const units = randInt(1, 4);

    // neededBy varies by status
    let neededBy;
    if ([STATUS.FULFILLED, STATUS.CANCELLED, STATUS.EXPIRED, STATUS.REJECTED].includes(status)) {
      neededBy = new Date(Date.now() - randInt(5, 60) * 86400000);
    } else {
      neededBy = new Date(Date.now() + randInt(1, 14) * 86400000);
    }

    // Build statusHistory
    const statusHistory = [
      { from: null, to: STATUS.PENDING_VERIFICATION, changedBy: patient._id, note: "Request created" },
    ];

    const hospitalUser = hospital;
    if ([STATUS.VERIFIED, STATUS.MATCHING, STATUS.MATCHED, STATUS.FULFILLED].includes(status)) {
      statusHistory.push({ from: STATUS.PENDING_VERIFICATION, to: STATUS.VERIFIED, changedBy: hospitalUser._id, note: "Verified by hospital" });
    }
    if (status === STATUS.REJECTED) {
      statusHistory.push({ from: STATUS.PENDING_VERIFICATION, to: STATUS.REJECTED, changedBy: hospitalUser._id, note: "Insufficient documentation" });
    }
    if ([STATUS.MATCHING, STATUS.MATCHED, STATUS.FULFILLED, STATUS.EXPIRED].includes(status)) {
      statusHistory.push({ from: STATUS.VERIFIED, to: STATUS.MATCHING, changedBy: hospitalUser._id, note: "Donor search initiated" });
    }
    if ([STATUS.MATCHED, STATUS.FULFILLED].includes(status)) {
      statusHistory.push({ from: STATUS.MATCHING, to: STATUS.MATCHED, changedBy: hospitalUser._id, note: "Compatible donor identified" });
    }
    if (status === STATUS.FULFILLED) {
      statusHistory.push({ from: STATUS.MATCHED, to: STATUS.FULFILLED, changedBy: hospitalUser._id, note: "Donation completed" });
    }
    if (status === STATUS.EXPIRED) {
      statusHistory.push({ from: STATUS.MATCHING, to: STATUS.EXPIRED, changedBy: hospitalUser._id, note: "Deadline passed" });
    }
    if (status === STATUS.CANCELLED) {
      statusHistory.push({ from: STATUS.PENDING_VERIFICATION, to: STATUS.CANCELLED, changedBy: patient._id, note: "Cancelled by patient" });
    }

    // Request location = hospital location
    const hospitalLocation = hospitalUser.location;

    const doc = await BloodRequest.create({
      patient: patient._id,
      hospital: hospitalUser._id,
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
      ...(status === STATUS.REJECTED ? { rejectionReason: "Insufficient documentation provided", verifiedBy: hospitalUser._id } : {}),
      ...(status === STATUS.CANCELLED ? { cancelledAt: new Date(Date.now() - randInt(1, 10) * 86400000), cancellationReason: "Treatment plan changed" } : {}),
      ...(status === STATUS.FULFILLED ? { fulfilledAt: new Date(Date.now() - randInt(1, 30) * 86400000), verifiedBy: hospitalUser._id, unitsFulfilled: units } : {}),
      ...(status === STATUS.EXPIRED ? {} : {}),
      ...(status === STATUS.VERIFIED ? { verifiedBy: hospitalUser._id, verifiedAt: new Date() } : {}),
    });
    requestDocs.push(doc);
  }
  console.log(`  ✔ ${requestDocs.length} blood requests created`);

  // ═══════════════════════════════════════════════════════════════════════
  // 7. DONATIONS (70) — linked to FULFILLED + some MATCHED requests
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n▸ Creating 70 donations...");
  const fulfilledRequests = requestDocs.filter(r => r.status === STATUS.FULFILLED);
  const matchedRequests = requestDocs.filter(r => r.status === STATUS.MATCHED);

  const donationDocs = [];

  // Confirmed donations for FULFILLED requests
  for (let i = 0; i < Math.min(fulfilledRequests.length, 50); i++) {
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
  for (let i = 0; i < Math.min(matchedRequests.length, 10); i++) {
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

  // Additional historical donations for variety
  for (let i = 0; i < 10; i++) {
    const donor = pick(allDonorDocs);
    const hospital = pick(hospitalDocs);
    const doc = await Donation.create({
      donor: donor._id,
      request: pick(requestDocs)._id,
      hospital: hospital._id,
      component: pick(COMPONENT_CODES),
      units: randInt(1, 2),
      status: pick(["CONFIRMED", "CANCELLED"]),
      donatedAt: new Date(Date.now() - randInt(30, 365) * 86400000),
      ...(pick(["CONFIRMED", "CANCELLED"]) === "CONFIRMED" ? { confirmedAt: new Date(), confirmedBy: hospital._id } : { cancelledAt: new Date(), cancellationReason: "Donor unavailable" }),
    });
    donationDocs.push(doc);
  }
  console.log(`  ✔ ${donationDocs.length} donations created`);

  // ═══════════════════════════════════════════════════════════════════════
  // 8. VOLUNTEER TASKS (50)
  // ═══════════════════════════════════════════════════════════════════════
  console.log("\n▸ Creating 50 volunteer tasks...");
  const taskDocs = [];

  for (let i = 0; i < 50; i++) {
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
        // Vary stock levels realistically
        let units;
        const stockRoll = rand();
        if (stockRoll < 0.15) units = 0;        // 15% out of stock
        else if (stockRoll < 0.35) units = randInt(1, 3);  // 20% low
        else if (stockRoll < 0.70) units = randInt(4, 12); // 35% available
        else units = randInt(13, 25);            // 30% well-stocked

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

  // Notifications for fulfilled requests
  for (const req of fulfilledRequests.slice(0, 15)) {
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

  // Notifications for matched requests
  for (const req of matchedRequests.slice(0, 8)) {
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

  // Notifications for verified requests
  const verifiedRequests = requestDocs.filter(r => r.status === STATUS.VERIFIED);
  for (const req of verifiedRequests.slice(0, 10)) {
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

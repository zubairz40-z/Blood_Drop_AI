require("dotenv").config();
const fs = require("fs");
const path = require("path");
const connectDB = require("../src/config/database");
const { getAuth } = require("../src/config/firebase");
const User = require("../src/models/User");

const CRED_PATH = path.join(__dirname, "..", ".demo-hospital-credentials.json");
const DEMO_HOSPITAL_PASSWORDS = {
  evercare: "evercare1234",
  square: "square1234",
  united: "united1234",
  labaid: "labaid1234",
  popular: "popular1234",
  ibnsina: "ibnsina1234",
  bsh: "bsh1234",
  greenlife: "greenlife1234",
  anwerkhan: "anwerkhan1234",
  holyfamily: "holyfamily1234",
  dmch: "dmch1234",
  kurmitola: "kurmitola1234",
  birdem: "birdem1234",
  nhf: "nhf1234",
  ahsania: "ahsania1234",
  asgarali: "asgarali1234",
  suhrawardy: "suhrawardy1234",
  nins: "nins1234",
  cmch: "cmch1234",
  osmani: "osmani1234",
};
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

function loadCredentials() {
  if (!fs.existsSync(CRED_PATH)) {
    const creds = { hospitals: {} };
    for (const acct of HOSPITAL_ACCOUNTS) {
      creds.hospitals[acct.key] = DEMO_HOSPITAL_PASSWORDS[acct.key] || `${acct.key}1234`;
    }
    fs.writeFileSync(CRED_PATH, JSON.stringify(creds, null, 2));
  }
  return JSON.parse(fs.readFileSync(CRED_PATH, "utf8"));
}

async function ensureFirebaseAndMongo({ email, password, name, role }) {
  let firebaseUser;
  try {
    firebaseUser = await getAuth().getUserByEmail(email);
    await getAuth().updateUser(firebaseUser.uid, { password, displayName: name });
  } catch {
    firebaseUser = await getAuth().createUser({ email, password, displayName: name });
  }

  const emailLower = email.toLowerCase();
  let mongoUserByUid = await User.findOne({ firebaseUid: firebaseUser.uid });
  let mongoUserByEmail = await User.findOne({ email: emailLower });

  if (mongoUserByUid && mongoUserByEmail && mongoUserByUid._id.toString() !== mongoUserByEmail._id.toString()) {
    await User.deleteOne({ _id: mongoUserByUid._id });
    mongoUserByUid = null;
  }

  let mongoUser = mongoUserByUid || mongoUserByEmail;
  if (!mongoUser) {
    mongoUser = await User.create({
      firebaseUid: firebaseUser.uid,
      email: emailLower,
      name,
      role,
      accountStatus: "active",
    });
  } else {
    mongoUser.firebaseUid = firebaseUser.uid;
    mongoUser.email = emailLower;
    mongoUser.name = name;
    mongoUser.role = role;
    await mongoUser.save();
  }
  return { firebaseUser, mongoUser };
}

async function main() {
  await connectDB();
  const creds = loadCredentials();

  for (const acct of HOSPITAL_ACCOUNTS) {
    const duplicateHospitals = await User.find({
      role: "hospital",
      name: acct.hospitalName,
    }).sort({ createdAt: 1 });

    const seededHospital = duplicateHospitals[0] || null;
    if (!seededHospital) {
      console.log(`⚠ Seeded hospital not found: ${acct.hospitalName}`);
      continue;
    }

    if (duplicateHospitals.length > 1) {
      for (const duplicate of duplicateHospitals.slice(1)) {
        console.log(`  ↳ Removing duplicate name record for ${acct.hospitalName}: ${duplicate.email}`);
        await User.deleteOne({ _id: duplicate._id });
      }
    }

    const emailDuplicates = await User.find({
      email: acct.email.toLowerCase(),
      _id: { $ne: seededHospital._id },
    });
    for (const duplicate of emailDuplicates) {
      console.log(`  ↳ Removing duplicate email record for ${acct.hospitalName}: ${duplicate.email}`);
      await User.deleteOne({ _id: duplicate._id });
    }

    const password = creds.hospitals[acct.key];
    const { firebaseUser } = await ensureFirebaseAndMongo({
      email: acct.email,
      password,
      name: acct.hospitalName,
      role: "hospital",
    });

    const sameUidDuplicate = await User.findOne({
      firebaseUid: firebaseUser.uid,
      _id: { $ne: seededHospital._id },
    });
    if (sameUidDuplicate) {
      console.log(`  ↳ Removing duplicate Firebase UID record for ${acct.hospitalName}: ${sameUidDuplicate.email}`);
      await User.deleteOne({ _id: sameUidDuplicate._id });
    }

    const liveHospital = await User.findById(seededHospital._id);
    if (liveHospital && liveHospital.firebaseUid !== firebaseUser.uid) {
      liveHospital.firebaseUid = firebaseUser.uid;
      await liveHospital.save();
    }

    console.log(`✔ ${acct.hospitalName} -> ${acct.email} / ${password}`);
  }

  console.log("\nDemo hospital credentials stored locally at:", CRED_PATH);
  process.exit(0);
}

main().catch((error) => {
  console.error("Hospital demo auth setup failed:", error);
  process.exit(1);
});

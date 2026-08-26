/**
 * demo-accounts-report.js — Prints demo account info (no passwords).
 * Reads from the local gitignored credentials file.
 *
 * Usage:
 *   cd backend
 *   npm run demo:accounts:report
 */

const fs = require("fs");
const path = require("path");

const CRED_PATH = path.join(__dirname, "..", ".demo-hospital-credentials.json");

const HOSPITALS = [
  { key: "evercare", name: "Evercare Hospital Dhaka", email: "evercare.hospital@blooddrop.test" },
  { key: "square", name: "Square Hospitals Ltd", email: "square.hospital@blooddrop.test" },
  { key: "united", name: "United Hospital Limited", email: "united.hospital@blooddrop.test" },
  { key: "labaid", name: "LABAID Specialized Hospital", email: "labaid.hospital@blooddrop.test" },
  { key: "popular", name: "Popular Medical College Hospital", email: "popular.hospital@blooddrop.test" },
  { key: "ibnsina", name: "Ibn Sina Specialized Hospital", email: "ibnsina.hospital@blooddrop.test" },
  { key: "bsh", name: "Bangladesh Specialized Hospital", email: "bsh.hospital@blooddrop.test" },
  { key: "greenlife", name: "Green Life Medical College Hospital", email: "greenlife.hospital@blooddrop.test" },
  { key: "anwerkhan", name: "Anwer Khan Modern Medical College Hospital", email: "anwerkhan.hospital@blooddrop.test" },
  { key: "holyfamily", name: "Holy Family Red Crescent Medical College Hospital", email: "holyfamily.hospital@blooddrop.test" },
  { key: "dmch", name: "Dhaka Medical College Hospital", email: "dmch.hospital@blooddrop.test" },
  { key: "kurmitola", name: "Kurmitola General Hospital", email: "kurmitola.hospital@blooddrop.test" },
  { key: "birdem", name: "BIRDEM General Hospital", email: "birdem.hospital@blooddrop.test" },
  { key: "nhf", name: "National Heart Foundation Hospital & Research Institute", email: "nhf.hospital@blooddrop.test" },
  { key: "ahsania", name: "Ahsania Mission Cancer & General Hospital", email: "ahsania.hospital@blooddrop.test" },
  { key: "asgarali", name: "Asgar Ali Hospital", email: "asgarali.hospital@blooddrop.test" },
  { key: "suhrawardy", name: "Shaheed Suhrawardy Medical College Hospital", email: "suhrawardy.hospital@blooddrop.test" },
  { key: "nins", name: "National Institute of Neurosciences & Hospital", email: "nins.hospital@blooddrop.test" },
  { key: "cmch", name: "Chattogram Medical College Hospital", email: "cmch.hospital@blooddrop.test" },
  { key: "osmani", name: "Sylhet MAG Osmani Medical College Hospital", email: "osmani.hospital@blooddrop.test" },
];

const DONORS = [
  { key: "evercareDonor", name: "Tanvir Hasan", email: "evercare.donor@blooddrop.test", bg: "A+" },
  { key: "squareDonor", name: "Nusrat Rahman", email: "square.donor@blooddrop.test", bg: "A+" },
  { key: "unitedDonor", name: "Arif Chowdhury", email: "united.donor@blooddrop.test", bg: "B+" },
  { key: "kurmitolaDonor", name: "Sabbir Ahmed", email: "kurmitola.donor@blooddrop.test", bg: "O+" },
  { key: "cmchDonor", name: "Farzana Begum", email: "cmch.donor@blooddrop.test", bg: "O+" },
  { key: "osmaniDonor", name: "Rakib Islam", email: "osmani.donor@blooddrop.test", bg: "B+" },
];

if (!fs.existsSync(CRED_PATH)) {
  console.log("\nNo demo credentials file found.");
  console.log("Run: npm run demo:accounts\n");
  process.exit(0);
}

const creds = JSON.parse(fs.readFileSync(CRED_PATH, "utf8"));

console.log("\n═══════════════════════════════════════════════════════");
console.log("  BloodDrop Demo Accounts");
console.log("═══════════════════════════════════════════════════════\n");

console.log("HOSPITALS:");
console.log("─────────────────────────────────────────────────────");
for (const h of HOSPITALS) {
  const pw = creds.hospitals?.[h.key] || "N/A";
  console.log(`  ${h.name}`);
  console.log(`    Email:    ${h.email}`);
  console.log(`    Password: ${pw}`);
  console.log("");
}

console.log("FEATURED DONORS:");
console.log("─────────────────────────────────────────────────────");
for (const d of DONORS) {
  const pw = creds.donors?.[d.key] || "N/A";
  console.log(`  ${d.name} (${d.bg})`);
  console.log(`    Email:    ${d.email}`);
  console.log(`    Password: ${pw}`);
  console.log("");
}

console.log("PATIENT:");
console.log("─────────────────────────────────────────────────────");
console.log(`  Rahima Khatun`);
console.log(`    Email:    patient.demo@blooddrop.test`);
console.log(`    Password: ${creds.patient || "N/A"}`);
console.log("");

console.log("VOLUNTEER:");
console.log("─────────────────────────────────────────────────────");
console.log(`  Kamal Hossain`);
console.log(`    Email:    volunteer.demo@blooddrop.test`);
console.log(`    Password: ${creds.volunteer || "N/A"}`);
console.log("");

console.log("═══════════════════════════════════════════════════════\n");

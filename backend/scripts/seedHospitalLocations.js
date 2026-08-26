require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User");

// [longitude, latitude] — note the order
const LOCATIONS = [
  { match: /dhaka medical/i, address: "Dhaka Medical College Hospital, Dhaka", coordinates: [90.3985, 23.7261] },
  { match: /square/i, address: "Square Hospital, West Panthapath, Dhaka", coordinates: [90.3843, 23.7519] },
];

// Anything unmatched gets central Dhaka so the demo has usable data
const FALLBACK = { address: "Dhaka, Bangladesh", coordinates: [90.4125, 23.8103] };

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const hospitals = await User.find({ role: "hospital" });
  console.log(`Found ${hospitals.length} hospital account(s)\n`);

  for (const h of hospitals) {
    const preset = LOCATIONS.find((l) => l.match.test(h.name)) || FALLBACK;

    h.address = preset.address;
    h.location = { type: "Point", coordinates: preset.coordinates };
    await h.save();

    console.log(`  ${h.name} -> ${preset.address}`);
  }

  await mongoose.disconnect();
  console.log("\nDone.");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
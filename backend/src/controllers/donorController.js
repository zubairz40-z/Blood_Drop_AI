const DonorProfile = require("../models/DonorProfile");
const {
  COMPONENT_CODES,
  MIN_WEIGHT_KG,
  MIN_AGE_YEARS,
  MAX_AGE_YEARS,
  calculateAge,
} = require("../utils/donationRules");

/**
 * Builds the initial eligibility array — one entry per chosen component,
 * all immediately eligible since there's no donation history yet.
 */
function buildInitialEligibility(donationTypes) {
  return donationTypes.map((component) => ({
    component,
    lastDonationAt: null,
    nextEligibleAt: null, // null = eligible now
    donationsThisYear: 0,
    medicallyDeferredUntil: null,
  }));
}

/**
 * Checks the donor meets the basic requirements for each chosen component.
 * Returns an array of problem strings — empty means all good.
 */
function validateAgainstRules({ dateOfBirth, weightKg, donationTypes }) {
  const problems = [];
  const age = calculateAge(dateOfBirth);

  if (age < MIN_AGE_YEARS) {
    problems.push(`Donors must be at least ${MIN_AGE_YEARS} years old.`);
  }
  if (age > MAX_AGE_YEARS) {
    problems.push(`Donors must be ${MAX_AGE_YEARS} or younger.`);
  }

  for (const component of donationTypes) {
    const minWeight = MIN_WEIGHT_KG[component];
    if (weightKg < minWeight) {
      problems.push(`${component} requires a minimum weight of ${minWeight}kg.`);
    }
  }

  return problems;
}

/** POST /api/donors/profile */
async function createProfile(req, res, next) {
  try {
    const userId = req.currentUser._id;

    const existing = await DonorProfile.findOne({ user: userId });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You already have a donor profile. Use PATCH to update it.",
      });
    }

    const { dateOfBirth, weightKg, bloodGroup, donationTypes, location } = req.body;

    if (!Array.isArray(donationTypes) || donationTypes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Select at least one donation type.",
      });
    }

    const unknown = donationTypes.filter((c) => !COMPONENT_CODES.includes(c));
    if (unknown.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Unknown donation type(s): ${unknown.join(", ")}`,
      });
    }

    const problems = validateAgainstRules({ dateOfBirth, weightKg, donationTypes });
    if (problems.length > 0) {
      return res.status(400).json({ success: false, message: problems.join(" ") });
    }

    if (!validLocation(location)) {
      return res.status(400).json({ success: false, message: "A valid non-zero GeoJSON Point is required for donor location." });
    }

    const profile = await DonorProfile.create({
      user: userId,
      dateOfBirth,
      weightKg,
      bloodGroup,
      donationTypes,
      eligibility: buildInitialEligibility(donationTypes),
      location,
    });

    res.status(201).json({ success: true, profile });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, message: "Validation failed. Check your input." });
    }
    next(err);
  }
}

/** GET /api/donors/profile */
async function getProfile(req, res, next) {
  try {
    const profile = await DonorProfile.findOne({ user: req.currentUser._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "No donor profile yet. Create one first.",
      });
    }

    res.json({ success: true, profile });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/donors/profile */
const UPDATABLE_FIELDS = ["dateOfBirth", "weightKg", "bloodGroup", "donationTypes", "location"];

function validLocation(location) {
  const coordinates = location?.coordinates;
  if (location?.type !== "Point" || !Array.isArray(coordinates) || coordinates.length !== 2) return false;
  const [lng, lat] = coordinates.map(Number);
  return Number.isFinite(lng) && Number.isFinite(lat) &&
    lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90 && !(lng === 0 && lat === 0);
}

async function updateProfile(req, res, next) {
  try {
    const profile = await DonorProfile.findOne({ user: req.currentUser._id });

    if (!profile) {
      return res.status(404).json({ success: false, message: "No donor profile yet." });
    }

    const updates = {};
    for (const field of UPDATABLE_FIELDS) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No updatable fields provided." });
    }

    if (updates.location !== undefined && !validLocation(updates.location)) {
      return res.status(400).json({ success: false, message: "A valid non-zero GeoJSON Point is required for donor location." });
    }

    // Re-check the rules against the merged values
    const problems = validateAgainstRules({
      dateOfBirth: updates.dateOfBirth ?? profile.dateOfBirth,
      weightKg: updates.weightKg ?? profile.weightKg,
      donationTypes: updates.donationTypes ?? profile.donationTypes,
    });
    if (problems.length > 0) {
      return res.status(400).json({ success: false, message: problems.join(" ") });
    }

    // If donationTypes changed, add eligibility entries for newly added ones
    // and drop entries for removed ones — but keep history for types kept.
    if (updates.donationTypes) {
      const unknown = updates.donationTypes.filter((c) => !COMPONENT_CODES.includes(c));
      if (unknown.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Unknown donation type(s): ${unknown.join(", ")}`,
        });
      }

      const kept = profile.eligibility.filter((e) =>
        updates.donationTypes.includes(e.component)
      );
      const existingCodes = kept.map((e) => e.component);
      const added = updates.donationTypes
        .filter((c) => !existingCodes.includes(c))
        .map((component) => ({
          component,
          lastDonationAt: null,
          nextEligibleAt: null,
          donationsThisYear: 0,
          medicallyDeferredUntil: null,
        }));
      profile.eligibility = [...kept, ...added];
    }

    Object.assign(profile, updates);
    await profile.save();

    if (updates.location) {
      const user = await User.findById(req.currentUser._id);
      user.location = { type: "Point", coordinates: updates.location.coordinates };
      if (updates.location.address !== undefined) user.address = updates.location.address;
      await user.save();
    }

    res.json({ success: true, profile });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, message: "Validation failed. Check your input." });
    }
    next(err);
  }
}

/** PATCH /api/donors/availability */
async function updateAvailability(req, res, next) {
  try {
    const { isAvailable } = req.body;

    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isAvailable must be true or false.",
      });
    }

    const profile = await DonorProfile.findOne({ user: req.currentUser._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: "No donor profile yet." });
    }

    profile.isAvailable = isAvailable;
    await profile.save();

    res.json({ success: true, isAvailable: profile.isAvailable });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createProfile,
  getProfile,
  updateProfile,
  updateAvailability,
};
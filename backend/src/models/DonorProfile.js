const mongoose = require("mongoose");
const { COMPONENT_CODES } = require("../utils/donationRules");

/**
 * One entry per component the donor is registered for.
 * Embedded rather than a separate collection — everything about a donor's
 * eligibility is fetched in a single query.
 */
const eligibilitySchema = new mongoose.Schema(
  {
    component: { type: String, enum: COMPONENT_CODES, required: true },
    lastDonationAt: { type: Date, default: null },
    nextEligibleAt: { type: Date, default: null },
    donationsThisYear: { type: Number, default: 0 },
    // Set by a hospital or admin for medical reasons, independent of timing
    medicallyDeferredUntil: { type: Date, default: null },
    deferralReason: { type: String, trim: true },
  },
  { _id: false }
);

const donorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    dateOfBirth: { type: Date, required: true },
    weightKg: { type: Number, required: true, min: 30, max: 250 },

    bloodGroup: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      index: true,
    },

    // Which components this donor is willing to give
    donationTypes: {
      type: [{ type: String, enum: COMPONENT_CODES }],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message: "Select at least one donation type.",
      },
    },

    eligibility: { type: [eligibilitySchema], default: [] },

    // GeoJSON — [longitude, latitude], NOT [lat, lng]
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (c) =>
            c.length === 2 &&
            c[0] >= -180 && c[0] <= 180 &&
            c[1] >= -90 && c[1] <= 90,
          message: "Coordinates must be [longitude, latitude].",
        },
      },
      address: { type: String, trim: true },
    },

    isAvailable: { type: Boolean, default: true, index: true },

    totalDonations: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Enables $geoNear for the matching funnel later
donorProfileSchema.index({ location: "2dsphere" });

// Common matching query: available donors of a given blood group
donorProfileSchema.index({ bloodGroup: 1, isAvailable: 1 });

module.exports = mongoose.model("DonorProfile", donorProfileSchema);
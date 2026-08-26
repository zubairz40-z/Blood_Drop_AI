/**
 * Deferral Model — Records when a donor is temporarily or permanently
 * prevented from donating. Written by on-site screening failures,
 * self-declarations, hospital decisions, or admin actions.
 */

const mongoose = require("mongoose");

const DEFERRAL_TYPES = ["temporary", "permanent"];

const DEFERRAL_REASONS = [
  "LOW_HEMOGLOBIN",
  "HIGH_BLOOD_PRESSURE",
  "LOW_BLOOD_PRESSURE",
  "INFECTION",
  "RECENT_ILLNESS",
  "MEDICATION",
  "TRAVEL",
  "WEIGHT_OUT_OF_RANGE",
  "PREGNANCY",
  "RECENT_SURGERY",
  "SKIN_DISEASE",
  "CHRONIC_DISEASE",
  "SCREENING_FAILED",
  "SELF_DECLARED",
  "OTHER",
];

const DEFERRAL_SOURCES = ["self", "hospital", "admin"];

const deferralSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reasonCode: {
      type: String,
      required: true,
      enum: DEFERRAL_REASONS,
    },
    type: {
      type: String,
      required: true,
      enum: DEFERRAL_TYPES,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      // null for permanent deferrals
    },
    source: {
      type: String,
      required: true,
      enum: DEFERRAL_SOURCES,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// Permanent deferrals should not have an endDate
deferralSchema.pre("validate", function (next) {
  if (this.type === "permanent" && this.endDate) {
    return next(new Error("Permanent deferrals must not have an endDate."));
  }
  if (this.type === "temporary" && !this.endDate) {
    return next(new Error("Temporary deferrals must have an endDate."));
  }
  next();
});

// Index for active deferral lookups: donor + whether currently active
deferralSchema.index({ donor: 1, startDate: -1 });

const Deferral = mongoose.model("Deferral", deferralSchema);

module.exports = { Deferral, DEFERRAL_TYPES, DEFERRAL_REASONS, DEFERRAL_SOURCES };

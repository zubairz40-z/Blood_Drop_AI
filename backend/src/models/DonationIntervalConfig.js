/**
 * DonationIntervalConfig.js — Configurable donation intervals per component.
 *
 * One active config per component. Falls back to the hardcoded defaults
 * in donationRules.js if no config record exists.
 */

const mongoose = require("mongoose");

const COMPONENT_CODES = ["WHOLE_BLOOD", "PLASMA", "PLATELETS", "DOUBLE_RED_CELLS"];

const donationIntervalConfigSchema = new mongoose.Schema(
  {
    component: {
      type: String,
      enum: COMPONENT_CODES,
      required: true,
      unique: true,
    },
    intervalDays: {
      type: Number,
      required: true,
      min: [1, "Interval must be at least 1 day"],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DonationIntervalConfig", donationIntervalConfigSchema);
module.exports.COMPONENT_CODES = COMPONENT_CODES;

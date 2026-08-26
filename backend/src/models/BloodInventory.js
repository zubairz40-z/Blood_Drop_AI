const mongoose = require("mongoose");
const { COMPONENT_CODES, BLOOD_GROUPS } = require("../utils/donationRules");

/**
 * One document per (hospital, bloodGroup, component) combination.
 *
 * Stores the hospital's current stock of each blood component. Updated on
 * donation completion (auto-increment) and by hospital staff (manual upsert).
 * Units must never be negative — enforced in the service layer.
 */
const bloodInventorySchema = new mongoose.Schema(
  {
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    bloodGroup: {
      type: String,
      required: true,
      enum: BLOOD_GROUPS,
    },

    component: {
      type: String,
      required: true,
      enum: COMPONENT_CODES,
    },

    units: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// One row per (hospital, blood group, component) — no duplicates
bloodInventorySchema.index({ hospital: 1, bloodGroup: 1, component: 1 }, { unique: true });

module.exports = mongoose.model("BloodInventory", bloodInventorySchema);

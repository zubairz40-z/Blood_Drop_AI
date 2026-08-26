const mongoose = require("mongoose");
const { COMPONENT_CODES } = require("../utils/donationRules");
const { STATUS, STATUS_CODES } = require("../utils/requestStatus");

const URGENCY = ["EMERGENCY", "URGENT", "ROUTINE"];

const bloodRequestSchema = new mongoose.Schema(
  {
    // Optional — a hospital may file for an unidentified emergency patient
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    // True when a hospital filed this itself rather than a patient
    createdByHospital: { type: Boolean, default: false, index: true },

    // The account that created the request — always set, for audit
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Free-text identification when there's no patient account
    patientName: { type: String, trim: true },
    patientPhone: { type: String, trim: true },

    // The hospital expected to verify and receive the donation
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    bloodGroup: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      index: true,
    },

    component: {
      type: String,
      required: true,
      enum: COMPONENT_CODES,
    },

    unitsRequired: { type: Number, required: true, min: 1, max: 20 },
    unitsFulfilled: { type: Number, default: 0, min: 0 },

    urgency: { type: String, required: true, enum: URGENCY, index: true },

    neededBy: { type: Date, required: true },

    status: {
      type: String,
      enum: STATUS_CODES,
      default: STATUS.PENDING_VERIFICATION,
      index: true,
    },

    // GeoJSON — [longitude, latitude]. Usually copied from the selected hospital.
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: {
        type: [Number],
        validate: {
          validator: (c) => {
            if (!c || c.length === 0) return true;
            return (
              c.length === 2 &&
              c[0] >= -180 && c[0] <= 180 &&
              c[1] >= -90 && c[1] <= 90
            );
          },
          message: "Coordinates must be [longitude, latitude].",
        },
      },
      address: { type: String, trim: true },
    },

    patientNote: { type: String, trim: true, maxlength: 500 },

    // Verification audit trail
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: { type: Date },
    rejectionReason: { type: String, trim: true },

    cancelledAt: { type: Date },
    cancellationReason: { type: String, trim: true },

    // The donor who accepted. Cleared if they withdraw or don't arrive.
    matchedDonor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    matchedAt: { type: Date },
    fulfilledAt: { type: Date },

    // Append-only history of every status change
    statusHistory: [
      {
        from: { type: String, enum: STATUS_CODES },
        to: { type: String, enum: STATUS_CODES },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        changedAt: { type: Date, default: Date.now },
        note: { type: String, trim: true },
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

bloodRequestSchema.index({ location: "2dsphere" });
bloodRequestSchema.index({ status: 1, urgency: 1, createdAt: -1 });
bloodRequestSchema.index({ hospital: 1, status: 1 });

/**
 * Records a transition. Validation happens in the controller via
 * assertTransition — this just writes the change and the audit entry.
 */
bloodRequestSchema.methods.applyStatus = function (to, changedBy, note) {
  this.statusHistory.push({ from: this.status, to, changedBy, note });
  this.status = to;
  return this;
};

module.exports = mongoose.model("BloodRequest", bloodRequestSchema);
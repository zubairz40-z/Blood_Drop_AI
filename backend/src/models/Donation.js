const mongoose = require("mongoose");
const { COMPONENT_CODES } = require("../utils/donationRules");

/**
 * A single donation event.
 *
 * Deliberately a simple three-state record rather than a full state machine —
 * BloodRequest owns the complex lifecycle; a donation only ever moves
 * PENDING → CONFIRMED or PENDING → CANCELLED.
 */
const DONATION_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
};
const DONATION_STATUS_CODES = Object.values(DONATION_STATUS);

const donationSchema = new mongoose.Schema(
  {
    // Refs User, not DonorProfile — authorization compares against the
    // authenticated user, and the rest of the codebase refs User the same way.
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BloodRequest",
      required: true,
      index: true,
    },

    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Copied from the request at creation, not looked up later. This is a
    // historical record: if the request is edited, what was given doesn't change.
    component: {
      type: String,
      required: true,
      enum: COMPONENT_CODES,
    },

    units: { type: Number, required: true, min: 1, max: 10, default: 1 },

    status: {
      type: String,
      enum: DONATION_STATUS_CODES,
      default: DONATION_STATUS.PENDING,
      index: true,
    },

    // When the donation physically happened
    donatedAt: { type: Date, default: Date.now },

    // When a hospital confirmed it — the moment eligibility actually updates
    confirmedAt: { type: Date },
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    cancelledAt: { type: Date },
    cancellationReason: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

// Donor history, newest first — the query behind GET /api/donations/my
donationSchema.index({ donor: 1, donatedAt: -1 });

// Hospital's pending-confirmation queue
donationSchema.index({ hospital: 1, status: 1 });

/**
 * A donor can only have one confirmed donation per request. Without this,
 * a double-clicked confirm button would increment unitsFulfilled twice and
 * defer the donor twice. Partial index so cancelled records don't collide.
 */
donationSchema.index(
  { donor: 1, request: 1 },
  {
    unique: true,
    partialFilterExpression: { status: DONATION_STATUS.CONFIRMED },
  }
);

module.exports = mongoose.model("Donation", donationSchema);
module.exports.DONATION_STATUS = DONATION_STATUS;
module.exports.DONATION_STATUS_CODES = DONATION_STATUS_CODES;
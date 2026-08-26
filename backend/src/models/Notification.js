const mongoose = require("mongoose");

/**
 * Notification types. Each corresponds to a real event in the request
 * lifecycle — nothing here fires speculatively.
 */
const NOTIFICATION_TYPE = {
  REQUEST_VERIFIED: "REQUEST_VERIFIED",
  MATCH_FOUND: "MATCH_FOUND",
  DONOR_CONTACTED: "DONOR_CONTACTED",
  DONOR_ACCEPTED: "DONOR_ACCEPTED",
  DONOR_DECLINED: "DONOR_DECLINED",
  DONATION_CONFIRMED: "DONATION_CONFIRMED",
  REQUEST_FULFILLED: "REQUEST_FULFILLED",
  REQUEST_CANCELLED: "REQUEST_CANCELLED",
};
const NOTIFICATION_TYPE_CODES = Object.values(NOTIFICATION_TYPE);

const notificationSchema = new mongoose.Schema(
  {
    // Who sees this
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: NOTIFICATION_TYPE_CODES,
      required: true,
      index: true,
    },

    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 500 },

    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date },

    // Optional links back to the thing this is about
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BloodRequest",
      index: true,
    },
    donation: { type: mongoose.Schema.Types.ObjectId, ref: "Donation" },

    /**
     * When a MATCH_FOUND notification stops being actionable.
     *
     * Emergency requests give a donor 2 minutes to respond, everything else
     * 5. Without this, one donor who never opens the app stalls a request
     * forever — the notification layer walks to the next donor in the
     * contact order once this passes.
     */
    expiresAt: { type: Date, index: true },

    /**
     * Which wave of contacting this belongs to. The first wave goes to the
     * primary donor; if it expires or is declined, wave 2 goes to the first
     * backup, and so on. Useful for audit and for the AI coordination UI.
     */
    wave: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true }
);

// The notification list query: a user's own, newest first
notificationSchema.index({ user: 1, createdAt: -1 });

// The unread badge count
notificationSchema.index({ user: 1, read: 1 });

/** Has this notification's response window closed? */
notificationSchema.methods.isExpired = function (asOf = new Date()) {
  return Boolean(this.expiresAt && this.expiresAt <= asOf);
};

module.exports = mongoose.model("Notification", notificationSchema);
module.exports.NOTIFICATION_TYPE = NOTIFICATION_TYPE;
module.exports.NOTIFICATION_TYPE_CODES = NOTIFICATION_TYPE_CODES;
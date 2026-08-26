/**
 * Payment.js — Funding transaction record.
 *
 * Tracks monetary donations made through bKash (or other providers).
 * Blood donation is never paid for — this is charitable platform support only.
 */

const mongoose = require("mongoose");

const PAYMENT_STATUS = {
  INITIATED: "INITIATED",
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
};

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ["bkash", "manual"],
      default: "bkash",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, "Amount must be at least 1"],
    },
    currency: {
      type: String,
      default: "BDT",
      enum: ["BDT"],
    },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.INITIATED,
      required: true,
      index: true,
    },
    paymentId: { type: String, default: null },
    transactionId: { type: String, default: null, index: true },
    reference: { type: String, default: null },
    providerRaw: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
module.exports.PAYMENT_STATUS = PAYMENT_STATUS;

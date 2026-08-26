/**
 * HealthDeclaration.js — Append-only health declaration history.
 *
 * Each submission creates a new record. Previous declarations are
 * never modified or deleted. Access is restricted to the donor
 * who made the declaration, authorized hospitals, and admins.
 */

const mongoose = require("mongoose");

const healthDeclarationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    answers: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    source: {
      type: String,
      enum: ["self", "hospital", "admin"],
      default: "self",
    },
    status: {
      type: String,
      enum: ["submitted", "reviewed", "flagged"],
      default: "submitted",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    declaredAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { timestamps: true }
);

// Append-only: no update or remove middleware enforced here, but the
// service layer never updates existing records.

healthDeclarationSchema.index({ donor: 1, declaredAt: -1 });

module.exports = mongoose.model("HealthDeclaration", healthDeclarationSchema);

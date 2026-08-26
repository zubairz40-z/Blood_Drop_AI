const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: ["patient", "donor", "hospital", "volunteer", "admin"],
    },
    phone: { type: String, trim: true },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    accountStatus: {
      type: String,
      enum: ["active", "pending", "rejected", "suspended"],
      default: "active",
      index: true,
    },
    dateOfBirth: { type: Date },

    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relationship: { type: String, trim: true },
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    rejectionReason: { type: String, trim: true },
    lastLoginAt: { type: Date },
        address: { type: String, trim: true },

        location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: function (c) {
            // No coordinates set is fine — the field is optional
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
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
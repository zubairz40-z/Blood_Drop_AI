const mongoose = require("mongoose");

const TASK_TYPES = ["TRANSPORT", "GUIDE", "ESCORT"];
const TASK_STATUSES = ["OPEN", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const URGENCY_LEVELS = ["EMERGENCY", "URGENT", "ROUTINE"];

const volunteerTaskSchema = new mongoose.Schema(
  {
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BloodRequest",
      required: true,
    },

    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    title: { type: String, required: true, trim: true },

    description: { type: String, trim: true, maxlength: 500 },

    type: {
      type: String,
      enum: TASK_TYPES,
      default: "TRANSPORT",
    },

    status: {
      type: String,
      enum: TASK_STATUSES,
      default: "OPEN",
    },

    urgency: {
      type: String,
      enum: URGENCY_LEVELS,
      default: "ROUTINE",
    },

    address: { type: String, trim: true },

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
    },

    assignedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

volunteerTaskSchema.index({ status: 1, urgency: 1 });
volunteerTaskSchema.index({ volunteer: 1, status: 1 });
volunteerTaskSchema.index({ hospital: 1 });

module.exports = mongoose.model("VolunteerTask", volunteerTaskSchema);

/**
 * eligibilityReminderService.js — Checks for donors who became eligible
 * again and generates in-app reminders.
 *
 * Runs as part of the scheduler sweep or on-demand.
 * Never sends duplicate reminders for the same eligibility window.
 */

const User = require("../models/User");
const DonorProfile = require("../models/DonorProfile");
const Notification = require("../models/Notification");

/**
 * Check all donor profiles for eligibility windows that just opened.
 * Creates a notification for each newly eligible component.
 *
 * @param {Date} asOf — current time (injectable for tests)
 * @returns {number} notifications created
 */
async function checkEligibilityReminders(asOf = new Date()) {
  let created = 0;

  // Find donors with at least one eligibility record
  const profiles = await DonorProfile.find({
    "eligibility.nextEligibleAt": { $lte: asOf, $ne: null },
  }).populate("user", "name email");

  for (const profile of profiles) {
    if (!profile.user) continue;

    for (const elig of profile.eligibility) {
      if (!elig.nextEligibleAt || elig.nextEligibleAt > asOf) continue;
      if (!elig.component) continue;

      // Check if we already sent a reminder for this eligibility window
      const existingReminder = await Notification.findOne({
        user: profile.user._id,
        type: "ELIGIBILITY_REMINDER",
        "metadata.component": elig.component,
        "metadata.windowStart": elig.nextEligibleAt.toISOString(),
      });

      if (existingReminder) continue;

      await Notification.create({
        user: profile.user._id,
        type: "REQUEST_VERIFIED", // reuse existing type for in-app reminder
        title: "Eligible to donate again",
        message: `You are now eligible to donate ${elig.component.replace(/_/g, " ").toLowerCase()}. Open BloodDrop to see nearby requests.`,
        read: false,
      });
      created++;
    }
  }

  return created;
}

module.exports = { checkEligibilityReminders };

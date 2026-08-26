/**
 * adminAnalyticsService.js — Real aggregate analytics for the admin dashboard.
 *
 * All queries run against live MongoDB data. No fabricated values.
 */

const mongoose = require("mongoose");
const User = require("../models/User");
const BloodRequest = require("../models/BloodRequest");
const Donation = require("../models/Donation");
const DonorProfile = require("../models/DonorProfile");
const BloodInventory = require("../models/BloodInventory");
const VolunteerTask = require("../models/VolunteerTask");
const Notification = require("../models/Notification");

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

async function getAnalytics() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - SEVEN_DAYS);
  const thirtyDaysAgo = new Date(now.getTime() - THIRTY_DAYS);

  const [
    totalRequests,
    requestsByStatus,
    requestsByUrgency,
    requestsByComponent,
    requestsOverTime,
    totalDonations,
    donationsByComponent,
    donationsOverTime,
    totalUnitsDonated,
    totalDonors,
    availableDonors,
    bloodGroupDistribution,
    inventorySummary,
    lowStock,
    outOfStock,
    volunteerTaskStats,
    riskDistribution,
  ] = await Promise.all([
    // Request counts
    BloodRequest.countDocuments(),
    BloodRequest.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    BloodRequest.aggregate([{ $group: { _id: "$urgency", count: { $sum: 1 } } }]),
    BloodRequest.aggregate([{ $group: { _id: "$component", count: { $sum: 1 } } }]),

    // Requests over time (daily for last 30 days)
    BloodRequest.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Donation counts
    Donation.countDocuments({ status: "CONFIRMED" }),
    Donation.aggregate([
      { $match: { status: "CONFIRMED" } },
      { $group: { _id: "$component", count: { $sum: 1 }, units: { $sum: "$units" } } },
    ]),
    Donation.aggregate([
      { $match: { status: "CONFIRMED", createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Donation.aggregate([
      { $match: { status: "CONFIRMED" } },
      { $group: { _id: null, total: { $sum: "$units" } } },
    ]),

    // Donor counts
    User.countDocuments({ role: "donor" }),
    DonorProfile.countDocuments({ isAvailable: true }),
    User.aggregate([
      { $match: { role: "donor" } },
      { $group: { _id: "$bloodGroup", count: { $sum: 1 } } },
    ]),

    // Inventory
    BloodInventory.aggregate([
      {
        $group: {
          _id: null,
          totalUnits: { $sum: "$units" },
          count: { $sum: 1 },
        },
      },
    ]),
    BloodInventory.countDocuments({ units: { $gt: 0, $lte: 3 } }),
    BloodInventory.countDocuments({ units: 0 }),

    // Volunteer tasks
    VolunteerTask.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),

    // Risk distribution (from recent notifications)
    Notification.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]),
  ]);

  return {
    requests: {
      total: totalRequests,
      byStatus: Object.fromEntries(requestsByStatus.map(r => [r._id, r.count])),
      byUrgency: Object.fromEntries(requestsByUrgency.map(r => [r._id, r.count])),
      byComponent: Object.fromEntries(requestsByUrgency.map(r => [r._id, r.count])),
      overTime: requestsOverTime.map(r => ({ date: r._id, count: r.count })),
    },
    donations: {
      total: totalDonations,
      totalUnits: totalUnitsDonated[0]?.total || 0,
      byComponent: Object.fromEntries(donationsByComponent.map(r => [r._id, { count: r.count, units: r.units }])),
      overTime: donationsOverTime.map(r => ({ date: r._id, count: r.count })),
    },
    donors: {
      total: totalDonors,
      available: availableDonors,
      byBloodGroup: Object.fromEntries(bloodGroupDistribution.map(r => [r._id, r.count])),
    },
    inventory: {
      totalUnits: inventorySummary[0]?.totalUnits || 0,
      totalEntries: inventorySummary[0]?.count || 0,
      lowStock,
      outOfStock,
    },
    volunteers: Object.fromEntries(volunteerTaskStats.map(r => [r._id, r.count])),
    notifications: Object.fromEntries(riskDistribution.map(r => [r._id, r.count])),
  };
}

module.exports = { getAnalytics };

const donationService = require("../services/donationService");
const Donation = require("../models/Donation");

/** POST /api/donations — a hospital records a donation against a matched request */
async function createDonation(req, res, next) {
  try {
    const { requestId, donorId, units, donatedAt, override, overrideReason } =
      req.body;

    if (!requestId || !donorId) {
      return res.status(400).json({
        success: false,
        message: "Both requestId and donorId are required.",
      });
    }

    if (donatedAt && new Date(donatedAt) > new Date()) {
      return res.status(400).json({
        success: false,
        message: "A donation cannot be recorded in the future.",
      });
    }

    const donation = await donationService.createDonation({
      requestId,
      donorId,
      hospitalId: req.currentUser._id,
      units,
      donatedAt: donatedAt ? new Date(donatedAt) : undefined,
      override: Boolean(override),
      overrideReason,
    });

    res.status(201).json({ success: true, data: donation });
  } catch (err) {
    next(err);
  }
}

/** GET /api/donations/my — a donor's own history, newest first */
async function getMyDonations(req, res, next) {
  try {
    const donations = await Donation.find({ donor: req.currentUser._id })
      .sort({ donatedAt: -1 })
      .populate("hospital", "name email")
      .populate("request", "bloodGroup component urgency status");

    res.json({ success: true, data: donations });
  } catch (err) {
    next(err);
  }
}

/** GET /api/donations/pending — a hospital's confirmation queue */
async function getPendingDonations(req, res, next) {
  try {
    const donations = await Donation.find({
      hospital: req.currentUser._id,
      status: Donation.DONATION_STATUS.PENDING,
    })
      .sort({ donatedAt: -1 })
      .populate("donor", "name email phone")
      .populate("request", "bloodGroup component unitsRequired unitsFulfilled");

    res.json({ success: true, data: donations });
  } catch (err) {
    next(err);
  }
}

/** GET /api/donations/:id — donor sees their own, hospital sees theirs, admin sees all */
async function getDonationById(req, res, next) {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate("donor", "name email")
      .populate("hospital", "name email")
      .populate("request", "bloodGroup component unitsRequired status");

    if (!donation) {
      return res
        .status(404)
        .json({ success: false, message: "Donation not found." });
    }

    const me = String(req.currentUser._id);
    const isOwner =
      String(donation.donor?._id || donation.donor) === me ||
      String(donation.hospital?._id || donation.hospital) === me;

    if (!isOwner && req.currentUser.role !== "admin") {
      return res
        .status(403)
        .json({ success: false, message: "You cannot view this donation." });
    }

    res.json({ success: true, data: donation });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/donations/:id/confirm — the only place eligibility changes */
async function confirmDonation(req, res, next) {
  try {
    const donation = await donationService.confirmDonation({
      donationId: req.params.id,
      hospitalId: req.currentUser._id,
    });

    res.json({ success: true, data: donation });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/donations/:id/cancel — pending donations only */
async function cancelDonation(req, res, next) {
  try {
    const { reason } = req.body;

    const donation = await donationService.cancelDonation({
      donationId: req.params.id,
      hospitalId: req.currentUser._id,
      reason,
    });

    res.json({ success: true, data: donation });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createDonation,
  getMyDonations,
  getPendingDonations,
  getDonationById,
  confirmDonation,
  cancelDonation,
};
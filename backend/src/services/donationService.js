const Donation = require("../models/Donation");
const DonorProfile = require("../models/DonorProfile");
const BloodRequest = require("../models/BloodRequest");
const { STATUS, canTransition } = require("../utils/requestStatus");
const {
  checkEligibility,
  calculateNextEligibleAt,
} = require("../utils/donationRules");
const notificationService = require("./notificationService");
const inventoryService = require("./inventoryService");

const { DONATION_STATUS } = Donation;

/** Small helper so callers get consistent HTTP-flavoured errors. */
function fail(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

/**
 * Counts a donor's confirmed donations of one component in a given year.
 *
 * Derived rather than read from DonorProfile.donationsThisYear, because a
 * stored counter drifts: nothing resets it in January, and a cancelled
 * donation would leave it overstated. The Donation collection is the
 * source of truth; the profile field is only a cache we refresh here.
 */
async function countConfirmedThisYear(donorId, component, asOf = new Date()) {
  const yearStart = new Date(Date.UTC(asOf.getUTCFullYear(), 0, 1));
  const yearEnd = new Date(Date.UTC(asOf.getUTCFullYear() + 1, 0, 1));

  return Donation.countDocuments({
    donor: donorId,
    component,
    status: DONATION_STATUS.CONFIRMED,
    donatedAt: { $gte: yearStart, $lt: yearEnd },
  });
}

/**
 * Records a donation against a request. Starts PENDING — nothing about the
 * donor's eligibility changes until a hospital confirms it.
 *
 * Eligibility is checked here so an ineligible donor is caught before the
 * record exists. A hospital may override with { override, overrideReason },
 * because clinical staff have ground truth the database doesn't (a donation
 * given elsewhere, a physician's clearance). The override is deliberate and
 * recorded, never silent.
 */
async function createDonation({
  requestId,
  donorId,
  hospitalId,
  units = 1,
  donatedAt = new Date(),
  override = false,
  overrideReason,
}) {
  const request = await BloodRequest.findById(requestId);
  if (!request) fail("Request not found.", 404);

  if (String(request.hospital) !== String(hospitalId)) {
    fail("This request belongs to another hospital.", 403);
  }

  if (request.status !== STATUS.MATCHED) {
    fail(
      `Donations can only be recorded against a MATCHED request. This one is ${request.status}.`,
      409
    );
  }

  const profile = await DonorProfile.findOne({ user: donorId });
  if (!profile) fail("Donor profile not found.", 404);

  // Component comes from the request — the donor gives what was asked for.
  const component = request.component;

  const verdict = checkEligibility(profile, component, donatedAt);
  if (!verdict.eligible) {
    if (!override) {
      fail(`Donor is not eligible: ${verdict.reasons.join("; ")}`, 409);
    }
    if (!overrideReason || !overrideReason.trim()) {
      fail("An override requires a written reason.", 400);
    }
  }

  return Donation.create({
    donor: donorId,
    request: requestId,
    hospital: hospitalId,
    component,
    units,
    donatedAt,
    status: DONATION_STATUS.PENDING,
    ...(override && !verdict.eligible
      ? { overrideReason: overrideReason.trim() }
      : {}),
  });
}

/**
 * Hospital confirms a donation actually happened. This is the only place
 * eligibility changes.
 *
 * Three writes fan out from here: the donation, the donor's per-component
 * eligibility, and the request's fulfilled count — which closes the request
 * automatically once the unit requirement is met.
 */
async function confirmDonation({ donationId, hospitalId }) {
  const donation = await Donation.findById(donationId);
  if (!donation) fail("Donation not found.", 404);

  if (String(donation.hospital) !== String(hospitalId)) {
    fail("This donation belongs to another hospital.", 403);
  }

  if (donation.status !== DONATION_STATUS.PENDING) {
    fail(`This donation is already ${donation.status}.`, 409);
  }

  // --- 1. The donation itself ---
  donation.status = DONATION_STATUS.CONFIRMED;
  donation.confirmedAt = new Date();
  donation.confirmedBy = hospitalId;
  await donation.save();

  // --- 2. Per-component eligibility ---
  const profile = await DonorProfile.findOne({ user: donation.donor });
  if (profile) {
    let entry = profile.eligibility.find(
      (e) => e.component === donation.component
    );

    // A first-time donor of this component has no entry yet
    if (!entry) {
      profile.eligibility.push({ component: donation.component });
      entry = profile.eligibility[profile.eligibility.length - 1];
    }

    // Deferral runs from when blood left the donor, NOT from confirmation —
    // a hospital may confirm a day late, and that must not shorten the wait.
    entry.lastDonationAt = donation.donatedAt;
    entry.nextEligibleAt = calculateNextEligibleAt(
      donation.component,
      donation.donatedAt
    );
    entry.donationsThisYear = await countConfirmedThisYear(
      donation.donor,
      donation.component,
      donation.donatedAt
    );

    profile.totalDonations = (profile.totalDonations || 0) + 1;
    await profile.save();
  }

  // --- 3. Auto-update hospital inventory ---
  const request = await BloodRequest.findById(donation.request);
  if (request) {
    await inventoryService.adjustUnits(
      String(request.hospital),
      request.bloodGroup,
      donation.component,
      +donation.units
    );
  }

  // --- 4. The request's fulfilled count, and closure if complete ---
  if (request) {
    request.unitsFulfilled = (request.unitsFulfilled || 0) + donation.units;

    // Meeting the unit count is a fact, not a judgement call — close it.
    // Guarded rather than asserted: if the request was cancelled between
    // recording and confirming, the donation still physically happened and
    // must still confirm. We just don't force a status it can't legally reach.
    const complete = request.unitsFulfilled >= request.unitsRequired;
    // Capture whether this confirmation is the one that closes the request,
    // BEFORE applyStatus mutates request.status — otherwise the second
    // canTransition() check below always fails (FULFILLED -> FULFILLED is not
    // allowed) and the patient never gets their "request fulfilled" notice.
    const justFulfilled = complete && canTransition(request.status, STATUS.FULFILLED);
    if (justFulfilled) {
      request.applyStatus(STATUS.FULFILLED, hospitalId, "Unit requirement met");
      request.fulfilledAt = new Date();
    }

    await request.save();

    await notificationService.notifyDonationConfirmed({ donorUserId: donation.donor, donation });

    if (justFulfilled) {
      const patientToNotify = request.patient || request.createdBy;
      if (patientToNotify) {
        await notificationService.notifyRequestFulfilled({ userId: patientToNotify, request });
      }
    }
  }

  // requestStatus lets the hospital UI say "fulfilled" only when it's actually true.
  return { donation, requestStatus: request ? request.status : null };
}

/**
 * Cancels a PENDING donation. Confirmed donations are never cancelled here —
 * unwinding an eligibility update and a fulfilled count is a correction, not
 * a cancellation, and should be a separate deliberate operation.
 */
async function cancelDonation({ donationId, hospitalId, reason }) {
  const donation = await Donation.findById(donationId);
  if (!donation) fail("Donation not found.", 404);

  if (String(donation.hospital) !== String(hospitalId)) {
    fail("This donation belongs to another hospital.", 403);
  }

  if (donation.status !== DONATION_STATUS.PENDING) {
    fail(
      `Only a pending donation can be cancelled. This one is ${donation.status}.`,
      409
    );
  }

  donation.status = DONATION_STATUS.CANCELLED;
  donation.cancelledAt = new Date();
  donation.cancellationReason = reason;
  return donation.save();
}

module.exports = {
  createDonation,
  confirmDonation,
  cancelDonation,
  countConfirmedThisYear,
};
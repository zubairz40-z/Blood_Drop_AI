const BloodRequest = require("../models/BloodRequest");
const Notification = require("../models/Notification");
const User = require("../models/User");
const matchingService = require("./matchingService");
const notificationService = require("./notificationService");
const { STATUS } = require("../utils/requestStatus");

const { NOTIFICATION_TYPE } = Notification;

function fail(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

/**
 * Contacts the next donor in a contact order.
 *
 * Waves rather than a broadcast: notifying every candidate at once means
 * several people travel to a hospital that needs one unit. Each wave gives
 * one donor a short exclusive window, and only on expiry or decline does the
 * next donor hear about it.
 */
async function contactNextDonor({ requestId, contactOrder, wave = 1, actorId, asOf = new Date() }) {
  const request = await BloodRequest.findById(requestId);
  if (!request) fail("Request not found.", 404);

  const donorUserId = contactOrder[wave - 1];
  if (!donorUserId) {
    return { contacted: null, exhausted: true, wave };
  }

  await matchingService.beginMatching(requestId, actorId);

  const notification = await notificationService.notifyMatchFound({
    donorUserId,
    request,
    wave,
    asOf,
  });

  return {
    contacted: String(donorUserId),
    exhausted: false,
    wave,
    expiresAt: notification.expiresAt,
    notificationId: notification._id,
  };
}

/**
 * A donor accepts. First acceptance wins — the transition guard makes a
 * second acceptance fail rather than silently overwrite the first.
 */
async function acceptMatch({ requestId, donorUserId, asOf = new Date() }) {
  const request = await BloodRequest.findById(requestId);
  if (!request) fail("Request not found.", 404);

  if (request.status !== STATUS.MATCHING) {
    fail(
      request.status === STATUS.MATCHED
        ? "Another donor has already accepted this request."
        : `This request is ${request.status} and is no longer accepting donors.`,
      409
    );
  }

  // The notification is the donor's authority to accept — without one, they
  // were never contacted for this request.
  const notification = await Notification.findOne({
    user: donorUserId,
    request: requestId,
    type: NOTIFICATION_TYPE.MATCH_FOUND,
  }).sort({ createdAt: -1 });

  if (!notification) {
    fail("You were not contacted about this request.", 403);
  }

  if (notification.isExpired(asOf)) {
    fail("This request has moved on to another donor.", 409);
  }

  const updated = await matchingService.assignDonor(
    requestId,
    donorUserId,
    donorUserId
  );

  notification.read = true;
  notification.readAt = asOf;
  await notification.save();

  const donor = await User.findById(donorUserId).select("name");
  const notifyTarget = request.patient || request.createdBy;
  if (notifyTarget) {
    await notificationService.notifyDonorAccepted({
      userId: notifyTarget,
      request: updated,
      donorName: donor?.name,
    });
  }

  return updated;
}

/**
 * A donor declines. Moves straight to the next wave.
 */
async function declineMatch({ requestId, donorUserId, contactOrder = [], asOf = new Date() }) {
  const request = await BloodRequest.findById(requestId);
  if (!request) fail("Request not found.", 404);

  const notification = await Notification.findOne({
    user: donorUserId,
    request: requestId,
    type: NOTIFICATION_TYPE.MATCH_FOUND,
  }).sort({ createdAt: -1 });

  if (!notification) {
    fail("You were not contacted about this request.", 403);
  }

  notification.read = true;
  notification.readAt = asOf;
  await notification.save();

  const notifyTarget = request.patient || request.createdBy;
  if (notifyTarget) {
    await notificationService.notifyDonorDeclined({
      userId: notifyTarget,
      request,
    });
  }

  // Move to the next donor if there is one
  if (contactOrder.length > 0 && request.status === STATUS.MATCHING) {
    return contactNextDonor({
      requestId,
      contactOrder,
      wave: (notification.wave || 1) + 1,
      actorId: donorUserId,
      asOf,
    });
  }

  return { contacted: null, exhausted: true, wave: notification.wave };
}

/**
 * Sweeps expired MATCH_FOUND notifications and advances each request to its
 * next wave. Intended to run on a timer or be poked by the AI orchestrator.
 */
async function sweepExpired({ asOf = new Date(), contactOrders = {} } = {}) {
  const expired = await notificationService.findExpiredMatches(asOf);
  const advanced = [];

  for (const notification of expired) {
    const request = notification.request;
    if (!request || request.status !== STATUS.MATCHING) continue;

    // Mark it read so the same notification isn't swept twice
    notification.read = true;
    notification.readAt = asOf;
    await notification.save();

    const order = contactOrders[String(request._id)] || [];
    const next = await contactNextDonor({
      requestId: request._id,
      contactOrder: order,
      wave: (notification.wave || 1) + 1,
      actorId: request.hospital,
      asOf,
    });

    advanced.push({ requestId: String(request._id), ...next });
  }

  return advanced;
}

/** A matched donor didn't arrive. Returns the request to the pool. */
async function releaseNoShow({ requestId, actorId }) {
  return matchingService.releaseDonor(
    requestId,
    actorId,
    "Donor did not arrive"
  );
}

module.exports = {
  contactNextDonor,
  acceptMatch,
  declineMatch,
  sweepExpired,
  releaseNoShow,
};
const Notification = require("../models/Notification");
const { NOTIFICATION_TYPE } = Notification;

/**
 * Creates notifications. Everything that notifies a user goes through here
 * rather than calling Notification.create directly, so the message wording
 * for each event type lives in one place and the response deadlines are
 * applied consistently.
 */

/**
 * Response windows in minutes, by urgency. An emergency donor gets two
 * minutes before the system moves to the next candidate; anything else
 * gets five. These are short on purpose — a stalled request is worse than
 * an impatient one.
 */
const RESPONSE_WINDOW_MINUTES = {
  EMERGENCY: 2,
  URGENT: 5,
  ROUTINE: 5,
};

function expiryFor(urgency, from = new Date()) {
  const minutes = RESPONSE_WINDOW_MINUTES[urgency] ?? 5;
  return new Date(from.getTime() + minutes * 60000);
}

/** Generic creator. Prefer the named helpers below. */
async function notify({ user, type, title, message, request, donation, expiresAt, wave }) {
  return Notification.create({
    user,
    type,
    title,
    message,
    request,
    donation,
    expiresAt,
    wave,
  });
}

/**
 * Tells a donor they match an open request.
 *
 * This is the only notification with a deadline — it is a call to action,
 * and the coordination layer needs to know when to give up waiting.
 */
async function notifyMatchFound({ donorUserId, request, wave = 1, asOf = new Date() }) {
  const urgent = request.urgency === "EMERGENCY";

  return notify({
    user: donorUserId,
    type: NOTIFICATION_TYPE.MATCH_FOUND,
    title: urgent ? "Emergency blood match" : "You match a blood request",
    message: `A ${request.urgency.toLowerCase()} request needs ${request.bloodGroup} ${humanComponent(
      request.component
    )}. Can you donate?`,
    request: request._id,
    expiresAt: expiryFor(request.urgency, asOf),
    wave,
  });
}

/** Tells the request owner their request cleared hospital verification. */
async function notifyRequestVerified({ userId, request }) {
  return notify({
    user: userId,
    type: NOTIFICATION_TYPE.REQUEST_VERIFIED,
    title: "Request verified",
    message: `Your ${request.bloodGroup} request has been verified and donor matching has begun.`,
    request: request._id,
  });
}

/** Tells the request owner a donor accepted. */
async function notifyDonorAccepted({ userId, request, donorName }) {
  return notify({
    user: userId,
    type: NOTIFICATION_TYPE.DONOR_ACCEPTED,
    title: "A donor accepted",
    message: `${donorName || "A donor"} has accepted your ${request.bloodGroup} request.`,
    request: request._id,
  });
}

/** Tells the request owner a donor declined and matching continues. */
async function notifyDonorDeclined({ userId, request }) {
  return notify({
    user: userId,
    type: NOTIFICATION_TYPE.DONOR_DECLINED,
    title: "Contacting the next donor",
    message: `A donor was unable to help. We are contacting the next candidate for your ${request.bloodGroup} request.`,
    request: request._id,
  });
}

/** Tells a donor their donation was confirmed by the hospital. */
async function notifyDonationConfirmed({ donorUserId, donation }) {
  return notify({
    user: donorUserId,
    type: NOTIFICATION_TYPE.DONATION_CONFIRMED,
    title: "Donation confirmed",
    message: `Your ${humanComponent(donation.component)} donation has been confirmed. Thank you.`,
    request: donation.request,
    donation: donation._id,
  });
}

/** Tells the request owner the request is complete. */
async function notifyRequestFulfilled({ userId, request }) {
  return notify({
    user: userId,
    type: NOTIFICATION_TYPE.REQUEST_FULFILLED,
    title: "Request fulfilled",
    message: `Your ${request.bloodGroup} request has been fulfilled.`,
    request: request._id,
  });
}

/** Tells a user a request they were involved in was cancelled. */
async function notifyRequestCancelled({ userId, request, reason }) {
  return notify({
    user: userId,
    type: NOTIFICATION_TYPE.REQUEST_CANCELLED,
    title: "Request cancelled",
    message: reason
      ? `A ${request.bloodGroup} request was cancelled: ${reason}`
      : `A ${request.bloodGroup} request was cancelled.`,
    request: request._id,
  });
}

/**
 * Finds MATCH_FOUND notifications whose window has closed without a response.
 * The coordination layer polls this to decide when to contact the next donor.
 */
async function findExpiredMatches(asOf = new Date()) {
  return Notification.find({
    type: NOTIFICATION_TYPE.MATCH_FOUND,
    read: false,
    expiresAt: { $lte: asOf },
  }).populate("request");
}

/** Display text for a component code. Codes stay in the database. */
function humanComponent(code) {
  return (
    {
      WHOLE_BLOOD: "whole blood",
      PLASMA: "plasma",
      PLATELETS: "platelets",
      DOUBLE_RED_CELLS: "double red cells",
    }[code] || code
  );
}

module.exports = {
  notify,
  notifyMatchFound,
  notifyRequestVerified,
  notifyDonorAccepted,
  notifyDonorDeclined,
  notifyDonationConfirmed,
  notifyRequestFulfilled,
  notifyRequestCancelled,
  findExpiredMatches,
  RESPONSE_WINDOW_MINUTES,
};
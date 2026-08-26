/**
 * emailService.js — Nodemailer email notifications for BloodDrop.
 *
 * All outbound email goes through this service. Provider failure is
 * always caught and logged — email never blocks core DB operations.
 *
 * Environment variables (backend only, never exposed to frontend):
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * If SMTP env vars are not configured, the service silently skips
 * sending and logs a warning. This keeps dev/test working without
 * requiring a real SMTP server.
 */

const nodemailer = require("nodemailer");

let transporter = null;
let configured = false;

// Lazily initialise once so the first send attempt sets up the connection
function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    configured = false;
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  configured = true;
  return transporter;
}

const FROM = process.env.SMTP_FROM || "BloodDrop <noreply@blooddrop.test>";

// ── Template helpers ────────────────────────────────────────────────────────

function matchFoundTemplate({ donorName, bloodGroup, component, urgency, hospital, expiresAt }) {
  return {
    subject: `[BloodDrop] ${urgency} — ${bloodGroup} donation needed`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#dc2626">BloodDrop — Donor Match</h2>
        <p>Hi ${donorName || "Donor"},</p>
        <p>A <strong>${urgency.toLowerCase()}</strong> request needs your help:</p>
        <ul>
          <li><strong>Blood group:</strong> ${bloodGroup}</li>
          <li><strong>Component:</strong> ${component}</li>
          <li><strong>Hospital:</strong> ${hospital || "See request details"}</li>
          ${expiresAt ? `<li><strong>Respond by:</strong> ${new Date(expiresAt).toLocaleString()}</li>` : ""}
        </ul>
        <p>Open BloodDrop to accept or decline this match.</p>
        <p style="color:#6b7280;font-size:12px">This is an automated notification from BloodDrop AI.</p>
      </div>
    `,
  };
}

function requestVerifiedTemplate({ patientName, bloodGroup, component }) {
  return {
    subject: `[BloodDrop] Your request has been verified`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#16a34a">Request Verified</h2>
        <p>Hi ${patientName || "Patient"},</p>
        <p>Your <strong>${bloodGroup} ${component}</strong> request has been verified by the hospital. Donor matching has begun.</p>
        <p style="color:#6b7280;font-size:12px">This is an automated notification from BloodDrop AI.</p>
      </div>
    `,
  };
}

function donationConfirmedTemplate({ donorName, component, hospital, donationDate, nextEligibleAt }) {
  return {
    subject: `[BloodDrop] Donation confirmed — Thank you!`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#16a34a">Donation Confirmed</h2>
        <p>Hi ${donorName || "Donor"},</p>
        <p>Your <strong>${component}</strong> donation at <strong>${hospital || "the hospital"}</strong> has been confirmed.</p>
        <ul>
          <li><strong>Date:</strong> ${donationDate || "Recorded"}</li>
          ${nextEligibleAt ? `<li><strong>Next eligible:</strong> ${new Date(nextEligibleAt).toLocaleDateString()}</li>` : ""}
        </ul>
        <p>Thank you for saving lives.</p>
        <p style="color:#6b7280;font-size:12px">This is an automated notification from BloodDrop AI.</p>
      </div>
    `,
  };
}

function eligibilityReminderTemplate({ donorName, component, eligibleFrom }) {
  return {
    subject: `[BloodDrop] You're eligible to donate ${component} again`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#2563eb">Eligibility Reminder</h2>
        <p>Hi ${donorName || "Donor"},</p>
        <p>You are now eligible to donate <strong>${component}</strong> again${eligibleFrom ? ` (since ${new Date(eligibleFrom).toLocaleDateString()})` : ""}.</p>
        <p>Open BloodDrop to see nearby requests you can help with.</p>
        <p style="color:#6b7280;font-size:12px">This is an automated notification from BloodDrop AI.</p>
      </div>
    `,
  };
}

// ── Send helpers ────────────────────────────────────────────────────────────

/**
 * Low-level send. Returns { sent: true } or { sent: false, error }.
 * Never throws.
 */
async function sendMail({ to, subject, html }) {
  const transport = getTransporter();
  if (!transport) {
    console.warn("[Email] SMTP not configured — skipping send to", to);
    return { sent: false, reason: "not_configured" };
  }
  try {
    await transport.sendMail({ from: FROM, to, subject, html });
    return { sent: true };
  } catch (err) {
    console.error("[Email] Send failed:", err.message);
    return { sent: false, error: err.message };
  }
}

// ── Named event senders ─────────────────────────────────────────────────────

async function sendMatchFound({ donorEmail, donorName, bloodGroup, component, urgency, hospital, expiresAt }) {
  const { subject, html } = matchFoundTemplate({ donorName, bloodGroup, component, urgency, hospital, expiresAt });
  return sendMail({ to: donorEmail, subject, html });
}

async function sendRequestVerified({ patientEmail, patientName, bloodGroup, component }) {
  const { subject, html } = requestVerifiedTemplate({ patientName, bloodGroup, component });
  return sendMail({ to: patientEmail, subject, html });
}

async function sendDonationConfirmed({ donorEmail, donorName, component, hospital, donationDate, nextEligibleAt }) {
  const { subject, html } = donationConfirmedTemplate({ donorName, component, hospital, donationDate, nextEligibleAt });
  return sendMail({ to: donorEmail, subject, html });
}

async function sendEligibilityReminder({ donorEmail, donorName, component, eligibleFrom }) {
  const { subject, html } = eligibilityReminderTemplate({ donorName, component, eligibleFrom });
  return sendMail({ to: donorEmail, subject, html });
}

module.exports = {
  sendMail,
  sendMatchFound,
  sendRequestVerified,
  sendDonationConfirmed,
  sendEligibilityReminder,
  getTransporter,
};

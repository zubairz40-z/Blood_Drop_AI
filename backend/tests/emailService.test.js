/**
 * Tests for the email service.
 * All external calls are skipped when SMTP is not configured.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

describe("EmailService", () => {
  it("exports all required functions", () => {
    const svc = require("../src/services/emailService");
    assert.equal(typeof svc.sendMail, "function");
    assert.equal(typeof svc.sendMatchFound, "function");
    assert.equal(typeof svc.sendRequestVerified, "function");
    assert.equal(typeof svc.sendDonationConfirmed, "function");
    assert.equal(typeof svc.sendEligibilityReminder, "function");
    assert.equal(typeof svc.getTransporter, "function");
  });

  it("returns { sent: false } when SMTP is not configured", async () => {
    const svc = require("../src/services/emailService");
    // Clear env so SMTP is not configured
    const origHost = process.env.SMTP_HOST;
    delete process.env.SMTP_HOST;

    const result = await svc.sendMail({ to: "test@test.com", subject: "Test", html: "<p>hi</p>" });
    assert.equal(result.sent, false);
    assert.equal(result.reason, "not_configured");

    // Restore
    if (origHost) process.env.SMTP_HOST = origHost;
  });

  it("returns getTransporter as null when SMTP is not configured", () => {
    const svc = require("../src/services/emailService");
    const origHost = process.env.SMTP_HOST;
    delete process.env.SMTP_HOST;

    const t = svc.getTransporter();
    assert.equal(t, null);

    if (origHost) process.env.SMTP_HOST = origHost;
  });

  it("sendMatchFound never throws", async () => {
    const svc = require("../src/services/emailService");
    const result = await svc.sendMatchFound({
      donorEmail: "donor@test.com",
      donorName: "Test Donor",
      bloodGroup: "O+",
      component: "WHOLE_BLOOD",
      urgency: "EMERGENCY",
      hospital: "Test Hospital",
    });
    assert.ok(result, "should return a result");
    assert.equal(typeof result.sent, "boolean");
  });

  it("sendRequestVerified never throws", async () => {
    const svc = require("../src/services/emailService");
    const result = await svc.sendRequestVerified({
      patientEmail: "patient@test.com",
      patientName: "Test Patient",
      bloodGroup: "A+",
      component: "PLASMA",
    });
    assert.ok(result);
    assert.equal(typeof result.sent, "boolean");
  });

  it("sendDonationConfirmed never throws", async () => {
    const svc = require("../src/services/emailService");
    const result = await svc.sendDonationConfirmed({
      donorEmail: "donor@test.com",
      donorName: "Donor",
      component: "PLATELETS",
      hospital: "Hospital",
    });
    assert.ok(result);
    assert.equal(typeof result.sent, "boolean");
  });

  it("sendEligibilityReminder never throws", async () => {
    const svc = require("../src/services/emailService");
    const result = await svc.sendEligibilityReminder({
      donorEmail: "donor@test.com",
      donorName: "Donor",
      component: "WHOLE_BLOOD",
      eligibleFrom: new Date(),
    });
    assert.ok(result);
    assert.equal(typeof result.sent, "boolean");
  });
});

/**
 * Tests for the bKash payment service.
 * Uses sandbox mode (no real network calls).
 */

const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

describe("BkashService", () => {
  it("exports all required functions", () => {
    const svc = require("../src/services/bkashService");
    assert.equal(typeof svc.getToken, "function");
    assert.equal(typeof svc.createPayment, "function");
    assert.equal(typeof svc.executePayment, "function");
    assert.equal(typeof svc.queryPayment, "function");
  });

  it("runs in sandbox mode when no credentials", () => {
    const svc = require("../src/services/bkashService");
    assert.equal(svc.SANDBOX_MODE, true, "should be in sandbox mode without real credentials");
  });

  it("getToken returns a sandbox token", async () => {
    const svc = require("../src/services/bkashService");
    const token = await svc.getToken();
    assert.ok(token, "token should not be empty");
    assert.ok(typeof token === "string", "token should be a string");
  });

  it("createPayment returns paymentId and URL in sandbox", async () => {
    const svc = require("../src/services/bkashService");
    const result = await svc.createPayment(500, "user123");
    assert.ok(result.paymentId, "should have paymentId");
    assert.ok(result.bkashURL, "should have bkashURL");
    assert.equal(result.sandbox, true);
  });

  it("executePayment returns transactionId in sandbox", async () => {
    const svc = require("../src/services/bkashService");
    const createResult = await svc.createPayment(500, "user123");
    const execResult = await svc.executePayment(createResult.paymentId);
    assert.ok(execResult.transactionId, "should have transactionId");
    assert.equal(execResult.statusMessage, "Successful");
  });

  it("queryPayment returns status in sandbox", async () => {
    const svc = require("../src/services/bkashService");
    const result = await svc.queryPayment("BKID123");
    assert.ok(result.status, "should have status");
  });
});

describe("Payment Model", () => {
  it("exports PAYMENT_STATUS constants", () => {
    const { PAYMENT_STATUS } = require("../src/models/Payment");
    assert.equal(PAYMENT_STATUS.INITIATED, "INITIATED");
    assert.equal(PAYMENT_STATUS.PENDING, "PENDING");
    assert.equal(PAYMENT_STATUS.COMPLETED, "COMPLETED");
    assert.equal(PAYMENT_STATUS.FAILED, "FAILED");
    assert.equal(PAYMENT_STATUS.CANCELLED, "CANCELLED");
  });

  it("Payment model has expected fields", () => {
    const Payment = require("../src/models/Payment");
    const schema = Payment.schema.paths;
    assert.ok(schema.user, "should have user field");
    assert.ok(schema.provider, "should have provider field");
    assert.ok(schema.amount, "should have amount field");
    assert.ok(schema.status, "should have status field");
    assert.ok(schema.paymentId, "should have paymentId field");
    assert.ok(schema.transactionId, "should have transactionId field");
  });
});

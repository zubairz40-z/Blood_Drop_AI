/**
 * bkashService.js — bKash Payment Gateway sandbox integration.
 *
 * All provider-specific logic lives here. The controller and routes
 * never touch the bKash API directly.
 *
 * Sandbox environment variables (backend only):
 *   BKASH_BASE_URL, BKASH_APP_KEY, BKASH_APP_SECRET,
 *   BKASH_USERNAME, BKASH_PASSWORD, BKASH_CALLBACK_URL
 *
 * In sandbox mode without real credentials, the service simulates
 * the provider flow so the full payment lifecycle can be tested.
 */

const crypto = require("crypto");
const Payment = require("../models/Payment");

const BASE_URL = process.env.BKASH_BASE_URL || "https://tokenized.sandbox.bka.sh/v1.2.0-beta";
const APP_KEY = process.env.BKASH_APP_KEY || "";
const APP_SECRET = process.env.BKASH_APP_SECRET || "";
const USERNAME = process.env.BKASH_USERNAME || "";
const PASSWORD = process.env.BKASH_PASSWORD || "";
const CALLBACK_URL = process.env.BKASH_CALLBACK_URL || "http://localhost:5000/api/payments/bkash/callback";

const SANDBOX_MODE = !APP_KEY || !APP_SECRET;

let cachedToken = null;
let tokenExpiry = 0;

/**
 * Authenticate with bKash and get an access token.
 * Caches the token until it expires.
 */
async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  if (SANDBOX_MODE) {
    cachedToken = "sandbox_token_" + Date.now();
    tokenExpiry = Date.now() + 3600000;
    return cachedToken;
  }

  const res = await fetch(`${BASE_URL}/token/grant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      username: USERNAME,
      password: PASSWORD,
    },
    body: JSON.stringify({ app_key: APP_KEY, app_secret: APP_SECRET }),
  });
  const data = await res.json();
  if (!data.id_token) throw new Error(data.errorMessage || "bKash token grant failed");
  cachedToken = data.id_token;
  tokenExpiry = Date.now() + (data.expires_in || 3600) * 1000 - 30000;
  return cachedToken;
}

/**
 * Create a payment on the bKash gateway.
 * Returns { paymentId, bkashURL } or throws.
 */
async function createPayment(amount, payerReference) {
  if (SANDBOX_MODE) {
    const paymentId = "BKID" + crypto.randomBytes(8).toString("hex").toUpperCase();
    return {
      paymentId,
      bkashURL: CALLBACK_URL + "?payment_id=" + paymentId + "&status=success",
      sandbox: true,
    };
  }

  const token = await getToken();
  const res = await fetch(`${BASE_URL}/tokenized/checkout/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: token,
    },
    body: JSON.stringify({
      amount: String(amount),
      currency: "BDT",
      intent: "sale",
      merchantInvoiceNumber: "BD-" + Date.now(),
      payerReference: payerReference || "anonymous",
      callbackURL: CALLBACK_URL,
    }),
  });
  const data = await res.json();
  if (!data.paymentID) throw new Error(data.errorMessage || "bKash create payment failed");
  return { paymentId: data.paymentID, bkashURL: data.bkashURL };
}

/**
 * Execute (confirm) a payment after user approval.
 */
async function executePayment(paymentId) {
  if (SANDBOX_MODE) {
    return {
      transactionId: "TXN" + crypto.randomBytes(8).toString("hex").toUpperCase(),
      amount: "0",
      statusMessage: "Successful",
    };
  }

  const token = await getToken();
  const res = await fetch(`${BASE_URL}/tokenized/checkout/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: token,
    },
    body: JSON.stringify({ paymentID: paymentId }),
  });
  const data = await res.json();
  if (data.statusCode !== "0000") throw new Error(data.statusMessage || "bKash execute failed");
  return {
    transactionId: data.trxID,
    amount: data.amount,
    statusMessage: data.statusMessage,
  };
}

/**
 * Query payment status.
 */
async function queryPayment(paymentId) {
  if (SANDBOX_MODE) {
    return { paymentId, status: "Completed", transactionId: "TXN" + crypto.randomBytes(8).toString("hex").toUpperCase() };
  }

  const token = await getToken();
  const res = await fetch(`${BASE_URL}/tokenized/checkout/payment/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: token,
    },
    body: JSON.stringify({ paymentID: paymentId }),
  });
  return res.json();
}

module.exports = { getToken, createPayment, executePayment, queryPayment, SANDBOX_MODE };

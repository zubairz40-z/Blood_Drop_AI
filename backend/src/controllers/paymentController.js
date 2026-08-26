/**
 * paymentController.js — Handles bKash payment flow endpoints.
 */

const Payment = require("../models/Payment");
const { PAYMENT_STATUS } = require("../models/Payment");
const bkashService = require("../services/bkashService");

function fail(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

/** POST /api/payments/bkash/create */
async function createBkashPayment(req, res, next) {
  try {
    const { amount, reference } = req.body;
    const userId = req.currentUser._id;

    if (!amount || typeof amount !== "number" || amount < 1) {
      fail("Amount must be a positive number.");
    }

    // Create payment record first (INITIATED)
    const payment = await Payment.create({
      user: userId,
      provider: "bkash",
      amount,
      currency: "BDT",
      status: PAYMENT_STATUS.INITIATED,
      reference: reference || null,
    });

    // Request payment from bKash
    const result = await bkashService.createPayment(amount, String(userId));
    payment.paymentId = result.paymentId;
    payment.status = PAYMENT_STATUS.PENDING;
    await payment.save();

    res.json({
      success: true,
      paymentId: result.paymentId,
      bkashURL: result.bkashURL,
      sandbox: result.sandbox || false,
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/payments/bkash/execute */
async function executeBkashPayment(req, res, next) {
  try {
    const { paymentId } = req.body;
    if (!paymentId) fail("paymentId is required.");

    const payment = await Payment.findOne({ paymentId });
    if (!payment) fail("Payment not found.", 404);

    // Ownership check: only the payment owner or admin can execute
    const isAdmin = req.currentUser.role === "admin";
    const isOwner = String(payment.user) === String(req.currentUser._id);
    if (!isAdmin && !isOwner) fail("Not authorized to execute this payment.", 403);

    if (payment.status === PAYMENT_STATUS.COMPLETED) {
      return res.json({ success: true, message: "Already completed" });
    }

    const result = await bkashService.executePayment(paymentId);
    payment.transactionId = result.transactionId;
    payment.status = PAYMENT_STATUS.COMPLETED;
    payment.providerRaw = result;
    await payment.save();

    res.json({ success: true, transactionId: result.transactionId });
  } catch (err) {
    // Mark as failed on provider error
    if (req.body.paymentId) {
      await Payment.findOneAndUpdate(
        { paymentId: req.body.paymentId, status: { $ne: PAYMENT_STATUS.COMPLETED } },
        { status: PAYMENT_STATUS.FAILED, providerRaw: { error: err.message } }
      );
    }
    next(err);
  }
}

/** GET /api/payments/my */
async function getMyPayments(req, res, next) {
  try {
    const payments = await Payment.find({ user: req.currentUser._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("-providerRaw");
    res.json({ success: true, payments });
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/payments — admin only */
async function getAllPayments(req, res, next) {
  try {
    const [payments, stats] = await Promise.all([
      Payment.find().sort({ createdAt: -1 }).limit(100).populate("user", "name email"),
      Payment.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
          },
        },
      ]),
    ]);
    res.json({ success: true, payments, stats });
  } catch (err) {
    next(err);
  }
}

module.exports = { createBkashPayment, executeBkashPayment, getMyPayments, getAllPayments };

/**
 * paymentRoutes.js — bKash payment endpoints.
 */

const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const authorizeRoles = require("../middleware/authorizeRoles");
const {
  createBkashPayment,
  executeBkashPayment,
  getMyPayments,
  getAllPayments,
} = require("../controllers/paymentController");

// Donor/authenticated user routes
router.post("/bkash/create", verifyFirebaseToken, createBkashPayment);
router.post("/bkash/execute", verifyFirebaseToken, executeBkashPayment);
router.get("/my", verifyFirebaseToken, getMyPayments);

// Admin routes
router.get("/admin/all", verifyFirebaseToken, authorizeRoles("admin"), getAllPayments);

module.exports = router;

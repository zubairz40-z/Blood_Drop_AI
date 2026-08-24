const express = require("express");
const router = express.Router();
const User = require("../models/User");
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const authorizeRoles = require("../middleware/authorizeRoles");

// Every route in this file requires an active admin
router.use(verifyFirebaseToken, authorizeRoles("admin"));

/** GET /api/admin/pending — accounts awaiting approval */
router.get("/pending", async (req, res) => {
  try {
    const users = await User.find({ accountStatus: "pending" })
      .select("-__v")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: users.length, users });
  } catch (err) {
    console.error("Pending fetch error:", err);
    res.status(500).json({ success: false, message: "Could not load pending accounts" });
  }
});

/** PATCH /api/admin/users/:id/approve */
router.patch("/users/:id/approve", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (user.accountStatus !== "pending") {
      return res.status(409).json({
        success: false,
        message: `That account is already ${user.accountStatus}.`,
      });
    }

    user.accountStatus = "active";
    user.approvedBy = req.currentUser._id;
    user.approvedAt = new Date();
    user.rejectionReason = undefined;
    await user.save();

    res.json({ success: true, user });
  } catch (err) {
    console.error("Approve error:", err);
    res.status(500).json({ success: false, message: "Could not approve account" });
  }
});

/** PATCH /api/admin/users/:id/reject  body: { reason } */
router.patch("/users/:id/reject", async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (user.accountStatus !== "pending") {
      return res.status(409).json({
        success: false,
        message: `That account is already ${user.accountStatus}.`,
      });
    }

    user.accountStatus = "rejected";
    user.approvedBy = req.currentUser._id;
    user.approvedAt = new Date();
    user.rejectionReason = reason || "No reason provided";
    await user.save();

    res.json({ success: true, user });
  } catch (err) {
    console.error("Reject error:", err);
    res.status(500).json({ success: false, message: "Could not reject account" });
  }
});

module.exports = router;
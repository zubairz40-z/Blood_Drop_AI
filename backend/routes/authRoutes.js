const express = require("express");
const router = express.Router();
const User = require("../models/User");
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");

router.post("/register", verifyFirebaseToken, async (req, res) => {
  try {
    const { uid, email } = req.firebaseUser;
    const { name, role, phone, bloodGroup } = req.body;

    const existing = await User.findOne({ firebaseUid: uid });
    if (existing) {
      return res.status(200).json({ success: true, user: existing });
    }

    const user = await User.create({
      firebaseUid: uid,
      email,
      name,
      role,
      phone,
      bloodGroup,
    });

    res.status(201).json({ success: true, user });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Could not create account" });
  }
});

router.post("/login", verifyFirebaseToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No profile found for this account. Please register first.",
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: "This account has been suspended.",
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    res.json({ success: true, user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Something went wrong on the server" });
  }
});

router.get("/me", verifyFirebaseToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!user) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ success: false, message: "Something went wrong on the server" });
  }
});

module.exports = router;
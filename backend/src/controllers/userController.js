const User = require("../models/User");

async function register(req, res) {
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
}

async function login(req, res) {
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
}

async function getMe(req, res) {
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
}

async function updateMe(req, res) {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    if (!user) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    const allowed = ["name", "phone", "bloodGroup"];
    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    }

    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ success: false, message: "Could not update profile" });
  }
}

module.exports = { register, login, getMe, updateMe };

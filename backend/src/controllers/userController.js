const User = require("../models/User");

const SELF_SERVICE_ROLES = ["patient", "donor", "volunteer", "hospital"];
const ROLES_NEEDING_APPROVAL = ["hospital"];

/** POST /api/auth/register */
async function register(req, res, next) {
  try {
    const { uid, email } = req.firebaseUser;
    const { name, role, phone, bloodGroup } = req.body;

    if (!SELF_SERVICE_ROLES.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "That account type cannot be self-registered.",
      });
    }

    const existing = await User.findOne({ firebaseUid: uid });
    if (existing) {
      return res.status(200).json({ success: true, user: existing });
    }

    const accountStatus = ROLES_NEEDING_APPROVAL.includes(role) ? "pending" : "active";

    const user = await User.create({
      firebaseUid: uid,
      email,
      name,
      role,
      phone,
      bloodGroup,
      accountStatus,
    });

    res.status(201).json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/login */
async function login(req, res, next) {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No profile found for this account. Please register first.",
      });
    }

    if (user.accountStatus === "pending") {
      return res.status(403).json({
        success: false,
        message: "Your account is awaiting admin approval.",
      });
    }

    if (user.accountStatus === "rejected" || user.accountStatus === "suspended") {
      return res.status(403).json({
        success: false,
        message: "This account is not active. Please contact support.",
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

/** GET /api/auth/me */
async function getMe(req, res, next) {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });

    if (!user) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    if (user.accountStatus && user.accountStatus !== "active") {
      return res.status(403).json({ success: false, message: "This account is not active." });
    }

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

// Whitelist — everything else in the request body is ignored
const UPDATABLE_FIELDS = [
  "name",
  "phone",
  "bloodGroup",
  "dateOfBirth",
  "location",
  "emergencyContact",
];

/** PATCH /api/users/me */
async function updateMe(req, res, next) {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });

    if (!user) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    if (user.accountStatus && user.accountStatus !== "active") {
      return res.status(403).json({ success: false, message: "This account is not active." });
    }

    const updates = {};
    for (const field of UPDATABLE_FIELDS) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No updatable fields provided.",
      });
    }

    Object.assign(user, updates);
    await user.save(); // triggers schema validation, e.g. the bloodGroup enum

    res.json({ success: true, user });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, message: "Validation failed. Check your input." });
    }
    next(err);
  }
}

module.exports = { register, login, getMe, updateMe };
const User = require("../models/User");

/**
 * Must run AFTER verifyFirebaseToken.
 * Looks up the caller's profile and checks their role.
 * Usage: router.get("/x", verifyFirebaseToken, requireRole("admin"), handler)
 */
function authorizeRoles(...allowedRoles) {
  return async (req, res, next) => {
    try {
      const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });

      if (!user) {
        return res.status(404).json({ success: false, message: "Profile not found" });
      }

      if (user.accountStatus && user.accountStatus !== "active") {
        return res.status(403).json({ success: false, message: "This account is not active." });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ success: false, message: "You do not have permission to do that." });
      }

      req.currentUser = user; // hand the profile to the route so it doesn't re-query
      next();
    } catch (err) {
      console.error("Role check error:", err);
      res.status(500).json({ success: false, message: "Something went wrong on the server" });
    }
  };
}

module.exports = authorizeRoles;
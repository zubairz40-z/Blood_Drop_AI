const User = require("../models/User");

function authorizeRoles(...allowedRoles) {
  return async (req, res, next) => {
    if (!req.firebaseUser) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    try {
      const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });

      if (!user) {
        return res.status(404).json({ success: false, message: "User profile not found" });
      }

      if (user.isBanned) {
        return res.status(403).json({ success: false, message: "Account suspended" });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ success: false, message: "Insufficient permissions" });
      }

      req.user = user;
      next();
    } catch (err) {
      return res.status(500).json({ success: false, message: "Authorization check failed" });
    }
  };
}

module.exports = authorizeRoles;

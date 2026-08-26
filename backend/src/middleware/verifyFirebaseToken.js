const { getAuth } = require("../config/firebase");
const User = require("../models/User");

async function verifyFirebaseToken(req, res, next) {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const idToken = header.split(" ")[1];

  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    req.firebaseUser = decoded;
    const user = await User.findOne({ firebaseUid: decoded.uid });
    if (user) {
      const verifiedEmail = String(decoded.email || "").toLowerCase();
      if (verifiedEmail && verifiedEmail !== user.email) {
        const collision = await User.findOne({ email: verifiedEmail, _id: { $ne: user._id } }).select("_id role firebaseUid").lean();
        if (collision) {
          return res.status(409).json({ success: false, message: "Firebase email is already linked to another BloodDrop account." });
        }
        user.email = verifiedEmail;
      }
      if (decoded.name && (!user.name || user.name === user.email)) user.name = decoded.name;
      if (user.isModified()) await user.save();
      req.currentUser = user;
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired session" });
  }
}

module.exports = verifyFirebaseToken;
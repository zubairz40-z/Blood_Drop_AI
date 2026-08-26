const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const authorizeRoles = require("../middleware/authorizeRoles");
const {
  createProfile,
  getProfile,
  updateProfile,
  updateAvailability,
} = require("../controllers/donorController");

// Every donor route requires an authenticated, active donor
router.use(verifyFirebaseToken, authorizeRoles("donor"));

router.post("/profile", createProfile);
router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.patch("/availability", updateAvailability);

module.exports = router;
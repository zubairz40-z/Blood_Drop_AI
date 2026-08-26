const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const authorizeRoles = require("../middleware/authorizeRoles");
const {
  createDonation,
  getMyDonations,
  getPendingDonations,
  getDonationById,
  confirmDonation,
  cancelDonation,
} = require("../controllers/donationController");

router.use(verifyFirebaseToken);

// IMPORTANT: literal paths before /:id, or Express reads "my" as an id
router.get("/my", authorizeRoles("donor"), getMyDonations);
router.get("/pending", authorizeRoles("hospital"), getPendingDonations);

router.post("/", authorizeRoles("hospital"), createDonation);

router.get("/:id", authorizeRoles("donor", "hospital", "admin"), getDonationById);
router.patch("/:id/confirm", authorizeRoles("hospital"), confirmDonation);
router.patch("/:id/cancel", authorizeRoles("hospital"), cancelDonation);

module.exports = router;
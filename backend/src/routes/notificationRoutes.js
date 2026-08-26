const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const {
  getMyNotifications,
  markRead,
  markAllRead,
} = require("../controllers/notificationController");

router.use(verifyFirebaseToken);

// No authorizeRoles here — every role has notifications, and each user only
// ever sees their own. Ownership is enforced in the controller.
router.get("/", getMyNotifications);

// Literal path before /:id, or Express reads "read-all" as an id
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markRead);

module.exports = router;
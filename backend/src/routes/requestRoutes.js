const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const authorizeRoles = require("../middleware/authorizeRoles");
const {
  createRequest,
  getMyRequests,
  getRequestById,
  updateRequest,
  cancelRequest,
  verifyRequest,
  rejectRequest,
} = require("../controllers/requestController");

router.use(verifyFirebaseToken);

// IMPORTANT: /my must come before /:id, or Express reads "my" as an id
router.get("/my", authorizeRoles("patient", "hospital", "admin"), getMyRequests);

router.post("/", authorizeRoles("patient"), createRequest);

router.get("/:id", authorizeRoles("patient", "hospital", "admin"), getRequestById);
router.patch("/:id", authorizeRoles("patient"), updateRequest);
router.post("/:id/cancel", authorizeRoles("patient"), cancelRequest);

router.post("/:id/verify", authorizeRoles("hospital"), verifyRequest);
router.post("/:id/reject", authorizeRoles("hospital"), rejectRequest);

module.exports = router;
/**
 * AI Routes — coordination endpoint.
 *
 * Patient, hospital, and admin can invoke the orchestrator.
 * Patients may only coordinate requests they own (ownership is checked
 * in the controller). Hospitals and admin can coordinate any request.
 */

const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const authorizeRoles = require("../middleware/authorizeRoles");
const { coordinateBloodRequest } = require("../controllers/aiController");

router.use(verifyFirebaseToken);

router.post("/coordinate", authorizeRoles("patient", "hospital", "admin"), coordinateBloodRequest);

module.exports = router;

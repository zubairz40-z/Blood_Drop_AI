const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const { listHospitals } = require("../controllers/hospitalController");

router.get("/", verifyFirebaseToken, listHospitals);

module.exports = router;
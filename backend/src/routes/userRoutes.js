const express = require("express");
const router = express.Router();
const { register, login, getMe, updateMe } = require("../controllers/userController");
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");

router.post("/register", verifyFirebaseToken, register);
router.post("/login", verifyFirebaseToken, login);
router.get("/me", verifyFirebaseToken, getMe);
router.patch("/me", verifyFirebaseToken, updateMe);

module.exports = router;

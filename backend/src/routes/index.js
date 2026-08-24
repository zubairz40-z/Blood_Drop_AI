const express = require("express");
const router = express.Router();
const userRoutes = require("./userRoutes");

router.get("/", (req, res) => {
  res.json({
    success: true,
    name: "BloodDrop AI API",
    status: "online",
  });
});

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "BloodDrop API is running",
  });
});

router.use("/users", userRoutes);

module.exports = router;

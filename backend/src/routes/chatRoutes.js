/**
 * Chat Routes — single endpoint for the BloodDrop chatbot.
 *
 * No authentication required: the chatbot is available on public-facing
 * pages as part of the existing site design. The endpoint is read-only
 * and performs no BloodDrop state changes.
 */

const express = require("express");
const router = express.Router();
const { handleChat } = require("../controllers/chatController");

router.post("/", handleChat);

module.exports = router;

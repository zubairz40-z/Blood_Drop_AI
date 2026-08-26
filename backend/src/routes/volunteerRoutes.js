const express = require("express");
const router = express.Router();
const verifyFirebaseToken = require("../middleware/verifyFirebaseToken");
const authorizeRoles = require("../middleware/authorizeRoles");
const volunteerController = require("../controllers/volunteerController");

router.use(verifyFirebaseToken);

// Volunteer-only routes
router.get("/tasks", authorizeRoles("volunteer"), volunteerController.listTasks);
router.get("/tasks/my", authorizeRoles("volunteer"), volunteerController.getMyTasks);
router.get("/history", authorizeRoles("volunteer"), volunteerController.getHistory);
router.get("/dashboard", authorizeRoles("volunteer"), volunteerController.getDashboard);
router.post("/tasks/:id/accept", authorizeRoles("volunteer"), volunteerController.acceptTask);
router.patch("/tasks/:id/start", authorizeRoles("volunteer"), volunteerController.startTask);
router.patch("/tasks/:id/complete", authorizeRoles("volunteer"), volunteerController.completeTask);
router.patch("/tasks/:id/cancel", authorizeRoles("volunteer"), volunteerController.cancelTask);

// Task creation: hospital or volunteer can create
router.post("/tasks", authorizeRoles("hospital", "volunteer"), volunteerController.createTask);

module.exports = router;

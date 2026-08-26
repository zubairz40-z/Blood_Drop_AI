const volunteerService = require("../services/volunteerService");

/** GET /api/volunteer/tasks — list open tasks */
async function listTasks(req, res, next) {
  try {
    const { urgency, type } = req.query;
    const tasks = await volunteerService.listOpenTasks({ urgency, type });
    res.json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    next(err);
  }
}

/** GET /api/volunteer/tasks/my — volunteer's active tasks */
async function getMyTasks(req, res, next) {
  try {
    const tasks = await volunteerService.getMyTasks(req.currentUser._id);
    res.json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    next(err);
  }
}

/** GET /api/volunteer/history — completed/cancelled tasks */
async function getHistory(req, res, next) {
  try {
    const tasks = await volunteerService.getHistory(req.currentUser._id);
    res.json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    next(err);
  }
}

/** POST /api/volunteer/tasks/:id/accept — accept an open task */
async function acceptTask(req, res, next) {
  try {
    const task = await volunteerService.acceptTask(req.params.id, req.currentUser._id);
    if (!task) {
      return res.status(409).json({
        success: false,
        message: "This task has already been accepted by another volunteer.",
      });
    }
    res.json({ success: true, task });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ success: false, message: "Task not found." });
    }
    next(err);
  }
}

/** PATCH /api/volunteer/tasks/:id/start — start an assigned task */
async function startTask(req, res, next) {
  try {
    const task = await volunteerService.startTask(req.params.id, req.currentUser._id);
    if (!task) {
      return res.status(400).json({
        success: false,
        message: "Task not found or not in ASSIGNED status.",
      });
    }
    res.json({ success: true, task });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ success: false, message: "Task not found." });
    }
    next(err);
  }
}

/** PATCH /api/volunteer/tasks/:id/complete — complete an in-progress task */
async function completeTask(req, res, next) {
  try {
    const task = await volunteerService.completeTask(req.params.id, req.currentUser._id);
    if (!task) {
      return res.status(400).json({
        success: false,
        message: "Task not found or not in IN_PROGRESS status.",
      });
    }
    res.json({ success: true, task });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ success: false, message: "Task not found." });
    }
    next(err);
  }
}

/** PATCH /api/volunteer/tasks/:id/cancel — cancel a task */
async function cancelTask(req, res, next) {
  try {
    const result = await volunteerService.cancelTask(
      req.params.id,
      req.currentUser._id,
      req.currentUser.role
    );
    if (result === "FORBIDDEN") {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own tasks.",
      });
    }
    if (result === "ALREADY_DONE") {
      return res.status(400).json({
        success: false,
        message: "Task is already completed or cancelled.",
      });
    }
    if (!result) {
      return res.status(404).json({ success: false, message: "Task not found." });
    }
    res.json({ success: true, task: result });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ success: false, message: "Task not found." });
    }
    next(err);
  }
}

/** GET /api/volunteer/dashboard — stats */
async function getDashboard(req, res, next) {
  try {
    const stats = await volunteerService.getDashboardStats(req.currentUser._id);
    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
}

/** POST /api/volunteer/tasks — create a task (hospital or admin) */
async function createTask(req, res, next) {
  try {
    const { request: requestId, title, description, type, urgency, address, location } = req.body;
    if (!requestId || !title) {
      return res.status(400).json({
        success: false,
        message: "request and title are required.",
      });
    }
    const task = await volunteerService.createTask({
      requestId,
      hospitalId: req.currentUser._id,
      title,
      description,
      type,
      urgency,
      address,
      location,
    });
    res.status(201).json({ success: true, task });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, message: "Validation failed. Check your input." });
    }
    next(err);
  }
}

module.exports = {
  listTasks,
  getMyTasks,
  getHistory,
  acceptTask,
  startTask,
  completeTask,
  cancelTask,
  getDashboard,
  createTask,
};

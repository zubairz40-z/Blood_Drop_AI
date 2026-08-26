const VolunteerTask = require("../models/VolunteerTask");

/**
 * Lists open tasks available for volunteers to accept.
 * @param {object} filters - optional { urgency, type }
 */
async function listOpenTasks(filters = {}) {
  const query = { status: "OPEN" };
  if (filters.urgency) query.urgency = filters.urgency;
  if (filters.type) query.type = filters.type;

  return VolunteerTask.find(query)
    .sort({ urgency: 1, createdAt: -1 })
    .populate("hospital", "name address")
    .populate("request", "bloodGroup component urgency unitsRequired");
}

/**
 * Returns active tasks assigned to a volunteer.
 */
async function getMyTasks(volunteerId) {
  return VolunteerTask.find({
    volunteer: volunteerId,
    status: { $in: ["ASSIGNED", "IN_PROGRESS"] },
  })
    .sort({ assignedAt: -1 })
    .populate("hospital", "name address")
    .populate("request", "bloodGroup component urgency unitsRequired")
    .populate("donor", "name");
}

/**
 * Returns completed/cancelled history for a volunteer.
 */
async function getHistory(volunteerId) {
  return VolunteerTask.find({
    volunteer: volunteerId,
    status: { $in: ["COMPLETED", "CANCELLED"] },
  })
    .sort({ completedAt: -1 })
    .populate("hospital", "name")
    .populate("request", "bloodGroup component");
}

/**
 * Atomically accepts an open task. Uses findOneAndUpdate with status
 * condition to prevent two volunteers from accepting the same task.
 * Returns the updated task, or null if already taken.
 */
async function acceptTask(taskId, volunteerId) {
  return VolunteerTask.findOneAndUpdate(
    { _id: taskId, status: "OPEN" },
    {
      $set: {
        volunteer: volunteerId,
        status: "ASSIGNED",
        assignedAt: new Date(),
      },
    },
    { new: true }
  );
}

/**
 * Transitions ASSIGNED → IN_PROGRESS.
 */
async function startTask(taskId, volunteerId) {
  return VolunteerTask.findOneAndUpdate(
    { _id: taskId, volunteer: volunteerId, status: "ASSIGNED" },
    { $set: { status: "IN_PROGRESS", startedAt: new Date() } },
    { new: true }
  );
}

/**
 * Transitions IN_PROGRESS → COMPLETED. Only the assigned volunteer.
 */
async function completeTask(taskId, volunteerId) {
  return VolunteerTask.findOneAndUpdate(
    { _id: taskId, volunteer: volunteerId, status: "IN_PROGRESS" },
    { $set: { status: "COMPLETED", completedAt: new Date() } },
    { new: true }
  );
}

/**
 * Cancels a task. Volunteer can cancel own; admin/hospital can cancel any.
 */
async function cancelTask(taskId, userId, role) {
  const task = await VolunteerTask.findById(taskId);
  if (!task) return null;

  if (role === "volunteer" && String(task.volunteer) !== String(userId)) {
    return "FORBIDDEN";
  }

  if (task.status === "COMPLETED" || task.status === "CANCELLED") {
    return "ALREADY_DONE";
  }

  task.status = "CANCELLED";
  await task.save();
  return task;
}

/**
 * Dashboard stats for a volunteer.
 */
async function getDashboardStats(volunteerId) {
  const [assigned, inProgress, completed, total] = await Promise.all([
    VolunteerTask.countDocuments({ volunteer: volunteerId, status: "ASSIGNED" }),
    VolunteerTask.countDocuments({ volunteer: volunteerId, status: "IN_PROGRESS" }),
    VolunteerTask.countDocuments({ volunteer: volunteerId, status: "COMPLETED" }),
    VolunteerTask.countDocuments({ volunteer: volunteerId }),
  ]);

  return { assigned, inProgress, completed, total };
}

/**
 * Creates a volunteer task (hospital or admin only).
 */
async function createTask({ requestId, hospitalId, title, description, type, urgency, address, location }) {
  return VolunteerTask.create({
    request: requestId,
    hospital: hospitalId,
    title,
    description,
    type: type || "TRANSPORT",
    urgency: urgency || "ROUTINE",
    address,
    location,
  });
}

module.exports = {
  listOpenTasks,
  getMyTasks,
  getHistory,
  acceptTask,
  startTask,
  completeTask,
  cancelTask,
  getDashboardStats,
  createTask,
};

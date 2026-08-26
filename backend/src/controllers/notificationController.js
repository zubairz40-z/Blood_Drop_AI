const Notification = require("../models/Notification");

/** GET /api/notifications — the signed-in user's own, newest first */
async function getMyNotifications(req, res, next) {
  try {
    const { unreadOnly, limit = 50 } = req.query;

    const filter = { user: req.currentUser._id };
    if (unreadOnly === "true") filter.read = false;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 50, 100))
      .populate("request", "bloodGroup component urgency status neededBy");

    const unreadCount = await Notification.countDocuments({
      user: req.currentUser._id,
      read: false,
    });

    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/notifications/:id/read */
async function markRead(req, res, next) {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found." });
    }

    // A user may only mark their own notifications
    if (String(notification.user) !== String(req.currentUser._id)) {
      return res
        .status(403)
        .json({ success: false, message: "This notification is not yours." });
    }

    if (!notification.read) {
      notification.read = true;
      notification.readAt = new Date();
      await notification.save();
    }

    res.json({ success: true, notification });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/notifications/read-all */
async function markAllRead(req, res, next) {
  try {
    const result = await Notification.updateMany(
      { user: req.currentUser._id, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    res.json({ success: true, updated: result.modifiedCount });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMyNotifications,
  markRead,
  markAllRead,
};
/**
 * notificationMock.js — Mock data for the notification system.
 *
 * This represents the expected response shape from the future
 * /api/notifications endpoint. It does NOT contain real notification
 * logic — notifications are handled by Arefa's backend.
 */

export const mockNotifications = [
  {
    id: "demo-notification-001",
    type: "MATCH_FOUND",
    title: "Emergency blood match",
    message: "You match an urgent O+ whole blood request.",
    read: false,
    requestId: "demo-request-001",
    createdAt: "2026-08-26T07:00:00.000Z",
  },
]

/**
 * Notification API adapter — real backend endpoints.
 *
 * GET  /api/notifications          → { success, notifications, unreadCount }
 * PATCH /api/notifications/:id/read → { success, notification }
 * PATCH /api/notifications/read-all → { success, updated }
 */

import api from './client'

/**
 * Fetches the signed-in user's notifications.
 *
 * @returns {{ notifications: Array, unreadCount: number }}
 */
export async function fetchNotifications() {
  const { data } = await api.get('/api/notifications')
  return {
    notifications: (data.notifications || []).map(normalizeNotification),
    unreadCount: data.unreadCount || 0,
  }
}

/**
 * Marks a single notification as read.
 *
 * @param {string} notificationId
 * @returns {object} the updated notification
 */
export async function markNotificationRead(notificationId) {
  const { data } = await api.patch(`/api/notifications/${notificationId}/read`)
  return data.notification
}

/**
 * Marks all of the current user's notifications as read.
 *
 * @returns {number} count of notifications updated
 */
export async function markAllNotificationsRead() {
  const { data } = await api.patch('/api/notifications/read-all')
  return data.updated || 0
}

// ---------------------------------------------------------------------------
// Display config for notification type styling
// ---------------------------------------------------------------------------

const NOTIFICATION_TYPE_CONFIG = {
  MATCH_FOUND: { label: 'Blood Match Found', variant: 'error', category: 'emergency' },
  DONOR_CONTACTED: { label: 'Donor Contacted', variant: 'info', category: 'info' },
  DONOR_ACCEPTED: { label: 'Donor Accepted', variant: 'success', category: 'success' },
  DONOR_DECLINED: { label: 'Donor Declined', variant: 'warning', category: 'warning' },
  REQUEST_VERIFIED: { label: 'Request Verified', variant: 'info', category: 'info' },
  DONATION_CONFIRMED: { label: 'Donation Confirmed', variant: 'success', category: 'success' },
  REQUEST_FULFILLED: { label: 'Request Fulfilled', variant: 'success', category: 'success' },
  REQUEST_CANCELLED: { label: 'Request Cancelled', variant: 'neutral', category: 'system' },
}

export { NOTIFICATION_TYPE_CONFIG }

/**
 * Normalizes a backend notification into frontend-safe fields.
 *
 * Backend shape:
 *   { _id, user, type, title, message, read, request?, donation?, expiresAt, wave, createdAt }
 *
 * Frontend shape:
 *   { id, type, typeCategory, title, message, read, requestId, createdAt, timestamp,
 *     expiresAt, wave, actionLabel, actionPath }
 */
function normalizeNotification(n) {
  const typeConfig = NOTIFICATION_TYPE_CONFIG[n.type] || { category: 'system' }

  // Backend populates request with: bloodGroup, component, urgency, status, neededBy
  const requestObj = n.request && typeof n.request === 'object' ? n.request : null
  const requestId = requestObj?._id || (typeof n.request === 'string' ? n.request : null)

  return {
    id: n._id,
    type: n.type,
    typeCategory: typeConfig.category,
    title: n.title,
    message: n.message,
    read: n.read,
    requestId,
    createdAt: n.createdAt,
    timestamp: formatTimestamp(n.createdAt),
    expiresAt: n.expiresAt || null,
    wave: n.wave ?? null,
    // Populated request fields (available when backend .populate() is active)
    bloodGroup: requestObj?.bloodGroup || null,
    component: requestObj?.component || null,
    urgency: requestObj?.urgency || null,
    requestStatus: requestObj?.status || null,
    neededBy: requestObj?.neededBy || null,
    hospitalName: requestObj?.hospital?.name || null,
    actionLabel: requestId ? 'View' : undefined,
    actionPath: requestId ? buildActionPath(n.type, requestId) : undefined,
  }
}

function formatTimestamp(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function buildActionPath(type, requestId) {
  if (type === 'MATCH_FOUND') return `/donor/requests/${requestId}`
  if (type === 'DONATION_CONFIRMED') return '/donor/history'
  return `/patient/requests/${requestId}/tracking`
}

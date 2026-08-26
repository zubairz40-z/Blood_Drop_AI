/**
 * Match API adapter — donor matching and response endpoints.
 *
 * Real backend: POST /api/requests/:id/matching, POST /api/requests/:id/respond
 */

import api from './client'

/**
 * Kicks off donor matching for a request (hospital/admin action).
 *
 * @param {string} requestId
 * @returns {{ selection, contact }}
 */
export async function startMatching(requestId) {
  const { data } = await api.post(`/api/requests/${requestId}/matching`)
  return { selection: data.selection, contact: data.contact }
}

/**
 * Returns matching result for a request without triggering notifications.
 * Uses the same backend endpoint; contact.exhausted will be true if no donors
 * are available, or false if a notification was sent.
 *
 * @param {string} requestId
 * @returns {{ selection, contact }}
 */
export async function fetchMatchResult(requestId) {
  const { data } = await api.post(`/api/requests/${requestId}/matching`)
  return { selection: data.selection, contact: data.contact }
}

/**
 * Donor accepts or declines a matched request.
 *
 * @param {string} requestId
 * @param {"ACCEPT"|"DECLINE"} response
 * @returns {{ success, request?, result? }}
 */
export async function respondToMatch(requestId, response) {
  if (!['ACCEPT', 'DECLINE'].includes(response)) {
    throw new Error('Response must be ACCEPT or DECLINE')
  }
  const { data } = await api.post(`/api/requests/${requestId}/respond`, { response })
  return data
}

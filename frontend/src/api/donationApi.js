/**
 * Donation API adapter — real backend endpoints.
 *
 * GET    /api/donations/my       → { success, donations }  (donor)
 * GET    /api/donations/pending  → { success, donations }  (hospital)
 * PATCH  /api/donations/:id/confirm → { success, donation } (hospital)
 */

import api from './client'

/**
 * Fetches the current donor's donation history.
 *
 * @returns {Array} normalized donation records
 */
export async function fetchMyDonations() {
  const { data } = await api.get('/api/donations/my')
  return (data.donations || []).map(normalizeDonation)
}

/**
 * Fetches pending donations for the current hospital's confirmation queue.
 *
 * @returns {Array} normalized donation records
 */
export async function fetchPendingDonations() {
  const { data } = await api.get('/api/donations/pending')
  return (data.donations || []).map(normalizeDonation)
}

/**
 * Confirms a donation (hospital action).
 * Triggers eligibility recalculation on the backend.
 *
 * @param {string} donationId
 * @returns {{ donation: object, requestStatus: string|null }} the confirmed
 *   donation and the resulting status of the request it was recorded against
 *   (so the UI can say "fulfilled" only when that is actually true).
 */
export async function confirmDonation(donationId) {
  const { data } = await api.patch(`/api/donations/${donationId}/confirm`)
  return { donation: data.donation, requestStatus: data.requestStatus }
}

export async function createDonation({ requestId, donorId, units = 1 }) {
  const { data } = await api.post('/api/donations', { requestId, donorId, units })
  return normalizeDonation(data.donation)
}

/**
 * Cancels a pending donation (hospital action).
 *
 * @param {string} donationId
 * @param {string} [reason]
 * @returns {object} the cancelled donation
 */
export async function cancelDonation(donationId, reason) {
  const { data } = await api.patch(`/api/donations/${donationId}/cancel`, { reason })
  return data.donation
}

// ---------------------------------------------------------------------------
// Normalizer
// ---------------------------------------------------------------------------

/**
 * Normalizes a backend donation into frontend-safe fields.
 *
 * Backend shape (from donationController.populate):
 *   { _id, donor, request, hospital, component, units, status, donatedAt,
 *     confirmedAt, confirmedBy, createdAt, updatedAt }
 *
 * Populated fields:
 *   donor → { _id, name, email }
 *   hospital → { _id, name, email }
 *   request → { _id, bloodGroup, component, urgency, status }
 */
function normalizeDonation(d) {
  const request = d.request || {}
  const hospital = d.hospital || {}
  const donor = d.donor || {}

  return {
    id: d._id,
    requestId: request._id || d.request,
    donorId: donor._id || d.donor,
    donorName: donor.name || '—',
    donorEmail: donor.email || '',
    hospitalId: hospital._id || d.hospital,
    hospitalName: hospital.name || '—',
    bloodGroup: request.bloodGroup || '—',
    component: d.component || request.component || '—',
    units: d.units || 1,
    status: d.status,
    donatedAt: d.donatedAt,
    confirmedAt: d.confirmedAt,
    createdAt: d.createdAt,
  }
}

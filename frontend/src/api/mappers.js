/**
 * Translation between frontend form shapes and backend API shapes.
 *
 * The frontend and backend deliberately use different vocabularies:
 * forms are built for humans (age, weight, "available"), the API is built
 * for storage (dateOfBirth, weightKg, isAvailable, GeoJSON).
 *
 * Every rename, type coercion, and coordinate reorder lives here so the
 * two directions stay visible side by side and can't silently drift apart.
 */

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

/** Whole years since a date of birth. */
export function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null
  const dob = new Date(dateOfBirth)
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const monthDiff = now.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--
  }
  return age
}

/** ISO timestamp -> "YYYY-MM-DD" for <input type="date">. */
export function toDateInputValue(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toISOString().split('T')[0]
}

/**
 * Form location -> GeoJSON.
 *
 * CRITICAL: GeoJSON is [longitude, latitude] — the reverse of how people say it.
 * Swapping these silently relocates Dhaka (23.81 N, 90.41 E) into the ocean.
 */
export function toGeoJson(formLocation) {
  if (!formLocation) return undefined

  const lat = Number(formLocation.latitude)
  const lng = Number(formLocation.longitude)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    // Manual address with no coordinates captured yet
    return undefined
  }

  return {
    type: 'Point',
    coordinates: [lng, lat], // [longitude, latitude]
    address: formLocation.address || '',
  }
}

/** GeoJSON -> form location. Mirror of toGeoJson. */
export function fromGeoJson(geo) {
  const empty = { mode: 'manual', address: '', latitude: null, longitude: null }
  if (!geo?.coordinates || geo.coordinates.length !== 2) return empty

  const [lng, lat] = geo.coordinates // [longitude, latitude]
  return {
    mode: 'manual',
    address: geo.address || '',
    latitude: lat,
    longitude: lng,
  }
}

/* ------------------------------------------------------------------ */
/* Donation components                                                 */
/* ------------------------------------------------------------------ */

/** Backend enum code -> label for display. */
export const COMPONENT_LABELS = {
  WHOLE_BLOOD: 'Whole Blood',
  PLASMA: 'Plasma',
  PLATELETS: 'Platelets',
  DOUBLE_RED_CELLS: 'Double Red Cells',
}

export const COMPONENT_CODES = Object.keys(COMPONENT_LABELS)

/** Tolerates either a code or a label coming from older demo data. */
export function toComponentCode(value) {
  if (!value) return null
  if (COMPONENT_CODES.includes(value)) return value

  const match = Object.entries(COMPONENT_LABELS).find(
    ([, label]) => label.toLowerCase() === String(value).toLowerCase()
  )
  return match ? match[0] : null
}

export function toComponentLabel(code) {
  return COMPONENT_LABELS[code] || code
}

/* ------------------------------------------------------------------ */
/* Urgency                                                             */
/* ------------------------------------------------------------------ */

export const URGENCY_LABELS = {
  EMERGENCY: 'Emergency',
  URGENT: 'Urgent',
  ROUTINE: 'Routine',
}

/**
 * The UI uses NORMAL/URGENT/CRITICAL; the API uses ROUTINE/URGENT/EMERGENCY.
 * Also tolerates display labels from older demo data.
 */
const URGENCY_ALIASES = {
  NORMAL: 'ROUTINE',
  ROUTINE: 'ROUTINE',
  URGENT: 'URGENT',
  CRITICAL: 'EMERGENCY',
  EMERGENCY: 'EMERGENCY',
}

export function toUrgencyCode(value) {
  if (!value) return null

  const upper = String(value).toUpperCase()
  if (URGENCY_ALIASES[upper]) return URGENCY_ALIASES[upper]

  const match = Object.entries(URGENCY_LABELS).find(
    ([, label]) => label.toLowerCase() === String(value).toLowerCase()
  )
  return match ? match[0] : null
}

/** API urgency -> the value EmergencyLevelSelector uses. */
export function toUiUrgency(code) {
  const reverse = { ROUTINE: 'NORMAL', URGENT: 'URGENT', EMERGENCY: 'CRITICAL' }
  return reverse[code] || code
}

/* ------------------------------------------------------------------ */
/* Donor profile                                                       */
/* ------------------------------------------------------------------ */

/** Form -> POST/PATCH /api/donors/profile */
export function donorProfileToApi(form) {
  return {
    dateOfBirth: form.dateOfBirth || undefined,
    weightKg: form.weight ? Number(form.weight) : undefined,
    bloodGroup: form.bloodGroup || undefined,
    donationTypes: (form.donationTypes || [])
      .map(toComponentCode)
      .filter(Boolean),
    location: toGeoJson(form.location),
  }
}

/**
 * GET /api/donors/profile -> form.
 * `user` is the User document, since name and phone live there, not on the profile.
 */
export function donorProfileFromApi(profile, user = {}) {
  return {
    name: user.name || '',
    phone: user.phone || '',
    dateOfBirth: toDateInputValue(profile?.dateOfBirth),
    age: calculateAge(profile?.dateOfBirth),
    weight: profile?.weightKg != null ? String(profile.weightKg) : '',
    bloodGroup: profile?.bloodGroup || '',
    donationTypes: (profile?.donationTypes || []).map(toComponentLabel),
    availability: profile?.isAvailable ?? true,
    location: fromGeoJson(profile?.location),
  }
}

/**
 * Per-component eligibility, ready for display.
 * A null nextEligibleAt means eligible now — no donation recorded yet.
 */
export function eligibilityFromApi(profile) {
  const now = new Date()

  return (profile?.eligibility || []).map((entry) => {
    const nextEligibleAt = entry.nextEligibleAt ? new Date(entry.nextEligibleAt) : null
    const deferredUntil = entry.medicallyDeferredUntil
      ? new Date(entry.medicallyDeferredUntil)
      : null

    const timingBlocked = nextEligibleAt !== null && nextEligibleAt > now
    const medicallyBlocked = deferredUntil !== null && deferredUntil > now

    return {
      component: entry.component,
      label: toComponentLabel(entry.component),
      isEligible: !timingBlocked && !medicallyBlocked,
      nextEligibleAt,
      lastDonationAt: entry.lastDonationAt ? new Date(entry.lastDonationAt) : null,
      donationsThisYear: entry.donationsThisYear || 0,
      medicallyDeferredUntil: deferredUntil,
      deferralReason: entry.deferralReason || null,
    }
  })
}

/** Name and phone go to the User endpoint, not the donor profile endpoint. */
export function userFieldsToApi(form) {
  const payload = {}
  if (form.name !== undefined) payload.name = form.name
  if (form.phone !== undefined) payload.phone = form.phone
  return payload
}

/* ------------------------------------------------------------------ */
/* Blood request                                                       */
/* ------------------------------------------------------------------ */

/** Form -> POST /api/requests */
export function bloodRequestToApi(form) {
  return {
    hospital: form.hospital || undefined,
    bloodGroup: form.bloodGroup || undefined,
    component: toComponentCode(form.donationType),
    unitsRequired: form.units ? Number(form.units) : undefined,
    urgency: toUrgencyCode(form.emergencyLevel),
    neededBy: form.neededBy || undefined,
    location: toGeoJson(form.location),
    patientNote: form.patientNote || undefined,
  }
}

export const REQUEST_STATUS_LABELS = {
  PENDING_VERIFICATION: 'Awaiting hospital verification',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected by hospital',
  MATCHING: 'Finding donors',
  MATCHED: 'Donor matched',
  FULFILLED: 'Fulfilled',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
}

/** Status -> Badge variant from the existing UI kit. */
export const REQUEST_STATUS_VARIANTS = {
  PENDING_VERIFICATION: 'warning',
  VERIFIED: 'info',
  REJECTED: 'error',
  MATCHING: 'info',
  MATCHED: 'success',
  FULFILLED: 'success',
  CANCELLED: 'neutral',
  EXPIRED: 'neutral',
}

/** API request -> display shape. */
export function bloodRequestFromApi(request) {
  if (!request) return null

  return {
    id: request._id,
    shortId: `REQ-${String(request._id).slice(-6).toUpperCase()}`,
    bloodGroup: request.bloodGroup,
    component: request.component,
    componentLabel: toComponentLabel(request.component),
    unitsRequired: request.unitsRequired,
    unitsFulfilled: request.unitsFulfilled || 0,
    urgency: request.urgency,
    urgencyLabel: URGENCY_LABELS[request.urgency] || request.urgency,
    status: request.status,
    statusLabel: REQUEST_STATUS_LABELS[request.status] || request.status,
    statusVariant: REQUEST_STATUS_VARIANTS[request.status] || 'neutral',
    neededBy: request.neededBy ? new Date(request.neededBy) : null,
    createdAt: request.createdAt ? new Date(request.createdAt) : null,
    hospital: request.hospital
      ? { id: request.hospital._id || request.hospital, name: request.hospital.name || null }
      : null,
    location: fromGeoJson(request.location),
    patientNote: request.patientNote || '',
    rejectionReason: request.rejectionReason || null,
    cancellationReason: request.cancellationReason || null,
    statusHistory: request.statusHistory || [],
    createdByHospital: request.createdByHospital || false,
    patientName: request.patientName || null,
  }
}

/* ------------------------------------------------------------------ */
/* Patient / user profile                                              */
/* ------------------------------------------------------------------ */

/** User document -> patient profile form. */
export function userProfileFromApi(user) {
  const u = user || {}
  return {
    name: u.name || '',
    email: u.email || '',
    phone: u.phone || '',
    bloodGroup: u.bloodGroup || '',
    dateOfBirth: toDateInputValue(u.dateOfBirth),
    age: calculateAge(u.dateOfBirth),
    location: fromGeoJson(u.location),
    emergencyContact: {
      name: u.emergencyContact?.name || '',
      phone: u.emergencyContact?.phone || '',
      relationship: u.emergencyContact?.relationship || '',
    },
  }
}

/** Patient profile form -> PATCH /api/users/me. Email is deliberately excluded. */
export function userProfileToApi(form) {
  const payload = {
    name: form.name,
    phone: form.phone,
    bloodGroup: form.bloodGroup || undefined,
    emergencyContact: form.emergencyContact,
  }

  if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth

  const geo = toGeoJson(form.location)
  if (geo) payload.location = geo

  return payload
}
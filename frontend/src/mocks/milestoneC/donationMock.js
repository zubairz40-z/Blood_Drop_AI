/**
 * donationMock.js — Mock data for the donation record system.
 *
 * This represents the expected response shape from the future
 * /api/donations endpoint. It does NOT contain real donation logic —
 * the Donation model, controllers, and routes are handled by Arefa's backend.
 *
 * Components use the same enum codes as the backend (WHOLE_BLOOD, PLASMA, etc.).
 */

export const mockDonations = [
  {
    id: "demo-donation-001",
    requestId: "demo-request-001",
    donorId: "demo-donor-001",
    hospitalId: "demo-hospital-001",
    component: "WHOLE_BLOOD",
    units: 1,
    status: "CONFIRMED",
    donatedAt: "2026-08-20T10:30:00.000Z",
  },
]

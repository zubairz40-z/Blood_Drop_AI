/**
 * matchMock.js — Mock data for the donor matching system.
 *
 * This represents the expected response shape from the future
 * /api/requests/:id/match endpoint. It does NOT contain real
 * matching logic — matching is handled by Arefa's backend.
 *
 * Components use the same enum codes as the backend (WHOLE_BLOOD, PLASMA, etc.).
 */

export const mockMatchResult = {
  requestId: "demo-request-001",
  candidates: [
    {
      donorId: "demo-donor-001",
      name: "Demo Donor 1",
      bloodGroup: "O+",
      component: "WHOLE_BLOOD",
      eligible: true,
      available: true,
      distanceKm: 3.2,
      etaMinutes: 14,
      score: 92,
      reasons: [
        "Compatible blood group",
        "Eligible",
        "Available",
        "Nearby",
      ],
    },
    {
      donorId: "demo-donor-002",
      name: "Demo Donor 2",
      bloodGroup: "O+",
      component: "WHOLE_BLOOD",
      eligible: true,
      available: true,
      distanceKm: 6.7,
      etaMinutes: 23,
      score: 84,
      reasons: [
        "Compatible blood group",
        "Eligible",
        "Available",
      ],
    },
  ],
}

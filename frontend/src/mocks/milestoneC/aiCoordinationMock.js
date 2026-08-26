/**
 * aiCoordinationMock.js — Mock data for the AI orchestration layer.
 *
 * This represents the expected response shape from the future
 * /api/requests/:id/ai-coordination endpoint. It does NOT contain
 * real AI logic — Gemini integration and AI agents are built by Zubair
 * in later Milestone C steps.
 */

export const mockAiCoordination = {
  requestId: "demo-request-001",
  risk: "HIGH",
  riskScore: 72,
  recommendedDonor: "demo-donor-001",
  backupDonors: ["demo-donor-002"],
  nextAction: "CONTACT_PRIMARY_DONOR",
  explanation:
    "The selected donor is eligible, available, compatible, and geographically close.",
}

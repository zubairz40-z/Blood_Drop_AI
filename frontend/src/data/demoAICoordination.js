// Temporary frontend AI coordination demo data.
// Replace with real backend agent execution data later.

export const demoAICoordination = {
  'REQ-2001': {
    requestId: 'REQ-2001',
    bloodGroup: 'O+',
    donationType: 'Whole Blood',
    units: 2,
    hospital: 'Dhaka Medical College',
    emergencyLevel: 'URGENT',
    status: 'WAITING_RESPONSE',

    manager: {
      status: 'COMPLETED',
      description: 'The coordination workflow for this demo request has been prepared and routed to the required BloodDrop systems.',
      outputs: [
        'Blood requirement recognized',
        'Emergency level recorded',
        'Coordination stages prepared',
      ],
    },

    matching: {
      status: 'COMPLETED',
      description: 'Compatible donor candidates identified in the demo workflow.',
      candidatesReviewed: 6,
      compatibleCandidates: 3,
      criteria: [
        'Blood compatibility',
        'Donation type',
        'Availability',
      ],
    },

    eligibility: {
      status: 'COMPLETED',
      description: 'Candidate eligibility and scheduling status reviewed in the demo workflow.',
      eligibleCandidates: 2,
    },

    geo: {
      status: 'COMPLETED',
      description: 'Nearby candidate distances were compared in the demo workflow.',
      nearestDistance: 3.1,
    },

    riskAdvisor: {
      status: 'MONITORING',
      urgency: 'URGENT',
      advisory: 'No blocking demo advisory.',
    },

    bestMatch: {
      id: 'D-204',
      bloodGroup: 'O+',
      donationType: 'Whole Blood',
      distance: 3.1,
      availability: 'Available',
      factors: [
        'Compatible blood group',
        'Supports requested donation type',
        'Available in demo profile',
        '3.1 km away',
      ],
    },

    notification: {
      sentStatus: 'SENT',
      responseStatus: 'WAITING RESPONSE',
    },
  },
}

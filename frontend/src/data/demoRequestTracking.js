// Temporary frontend demo tracking data.
// Replace with backend request/agent status data later.

export const demoRequestTracking = {
  'REQ-2001': {
    requestId: 'REQ-2001',
    bloodGroup: 'O+',
    donationType: 'Whole Blood',
    units: 2,
    hospital: 'Dhaka Medical College',
    location: 'Dhanmondi, Dhaka',
    emergencyLevel: 'URGENT',
    currentStage: 'WAITING_RESPONSE',
    matchedDonor: {
      bloodGroup: 'O+',
      donationType: 'Whole Blood',
      distance: 3.1,
    },
    stages: [
      {
        key: 'REQUEST_CREATED',
        label: 'Request Created',
        description: 'Your blood request was created.',
        status: 'completed',
        timestamp: '12 min ago',
      },
      {
        key: 'AI_MANAGER_ACTIVATED',
        label: 'AI Manager Activated',
        description: 'Coordination workflow was initialized for this demo request.',
        status: 'completed',
        timestamp: '12 min ago',
      },
      {
        key: 'COMPATIBLE_DONORS_FOUND',
        label: 'Compatible Donors Found',
        description: 'Compatible donor candidates were identified in the demo workflow.',
        status: 'completed',
        timestamp: '10 min ago',
      },
      {
        key: 'ELIGIBILITY_CHECKED',
        label: 'Eligibility Checked',
        description: 'Donor eligibility status was reviewed in the demo workflow.',
        status: 'completed',
        timestamp: '9 min ago',
      },
      {
        key: 'LOCATION_SEARCH_COMPLETED',
        label: 'Location Search Completed',
        description: 'Nearby donor coordination was prepared.',
        status: 'completed',
        timestamp: '8 min ago',
      },
      {
        key: 'DONOR_NOTIFICATION_SENT',
        label: 'Donor Notification Sent',
        description: 'The demo workflow reached the donor notification stage.',
        status: 'completed',
        timestamp: '7 min ago',
      },
      {
        key: 'WAITING_RESPONSE',
        label: 'Waiting Response',
        description: 'Waiting for a donor response.',
        status: 'current',
        timestamp: null,
      },
      {
        key: 'HOSPITAL_CONFIRMATION',
        label: 'Hospital Confirmation',
        description: 'Hospital confirmation will follow after donor response.',
        status: 'upcoming',
        timestamp: null,
      },
      {
        key: 'DONATION_COMPLETED',
        label: 'Donation Completed',
        description: 'Final completion is recorded after hospital confirmation.',
        status: 'upcoming',
        timestamp: null,
      },
    ],
  },
}

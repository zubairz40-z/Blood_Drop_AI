// Temporary frontend demo data.
// Replace with authenticated hospital API data later.

export const demoHospital = {
  name: 'Demo Hospital',
  activeRequests: 4,
  matchedDonors: 3,
  donationsToday: 6,
  emergencyCases: 2,
}

export const demoActiveRequests = [
  {
    id: 'REQ-H301',
    bloodGroup: 'O+',
    donationType: 'Whole Blood',
    units: 2,
    emergencyLevel: 'CRITICAL',
    status: 'MATCHING',
    createdAt: '8 min ago',
  },
  {
    id: 'REQ-H302',
    bloodGroup: 'A+',
    donationType: 'Plasma',
    units: 1,
    emergencyLevel: 'URGENT',
    status: 'DONOR FOUND',
    createdAt: '22 min ago',
  },
  {
    id: 'REQ-H303',
    bloodGroup: 'B-',
    donationType: 'Platelets',
    units: 3,
    emergencyLevel: 'NORMAL',
    status: 'WAITING CONFIRMATION',
    createdAt: '1 hour ago',
  },
  {
    id: 'REQ-H304',
    bloodGroup: 'AB-',
    donationType: 'Whole Blood',
    units: 1,
    emergencyLevel: 'URGENT',
    status: 'MATCHING',
    createdAt: '2 hours ago',
  },
]

export const demoMatchedDonors = [
  {
    id: 'D-104',
    bloodGroup: 'O+',
    donationType: 'Whole Blood',
    requestId: 'REQ-H301',
    distance: 2.7,
    status: 'WAITING CONFIRMATION',
  },
  {
    id: 'D-108',
    bloodGroup: 'A+',
    donationType: 'Plasma',
    requestId: 'REQ-H302',
    distance: 4.3,
    status: 'CONFIRMED',
  },
  {
    id: 'D-112',
    bloodGroup: 'B-',
    donationType: 'Platelets',
    requestId: 'REQ-H303',
    distance: 1.9,
    status: 'WAITING CONFIRMATION',
  },
]

export const demoBloodInventory = [
  { bloodGroup: 'O+', units: 12 },
  { bloodGroup: 'O-', units: 4 },
  { bloodGroup: 'A+', units: 10 },
  { bloodGroup: 'A-', units: 3 },
  { bloodGroup: 'B+', units: 8 },
  { bloodGroup: 'B-', units: 2 },
  { bloodGroup: 'AB+', units: 5 },
  { bloodGroup: 'AB-', units: 1 },
]

export const demoDonationsToday = [
  { id: 'DON-401', requestId: 'REQ-H298', bloodGroup: 'O-', completedAt: '9:15 AM' },
  { id: 'DON-402', requestId: 'REQ-H295', bloodGroup: 'A+', completedAt: '10:02 AM' },
  { id: 'DON-403', requestId: 'REQ-H297', bloodGroup: 'B+', completedAt: '11:30 AM' },
  { id: 'DON-404', requestId: 'REQ-H299', bloodGroup: 'O+', completedAt: '1:45 PM' },
  { id: 'DON-405', requestId: 'REQ-H300', bloodGroup: 'AB+', completedAt: '2:20 PM' },
  { id: 'DON-406', requestId: 'REQ-H296', bloodGroup: 'A-', completedAt: '3:05 PM' },
]

export const demoInProgressDonations = [
  {
    id: 'REQ-H302',
    donorId: 'D-108',
    bloodGroup: 'A+',
    donationType: 'Plasma',
    status: 'IN PROGRESS',
    startedAt: '15 min ago',
  },
]

export const demoCompletedDonations = [
  {
    id: 'REQ-H288',
    bloodGroup: 'O+',
    donationType: 'Whole Blood',
    donorId: 'D-091',
    status: 'COMPLETED',
    completedAt: 'Today · 10:42 AM',
  },
  {
    id: 'REQ-H274',
    bloodGroup: 'A+',
    donationType: 'Platelets',
    donorId: 'D-085',
    status: 'COMPLETED',
    completedAt: 'Yesterday',
  },
]

// Temporary frontend demo data.
// Replace with authenticated API data during backend integration.

export const demoPatient = {
  name: 'Demo User',
  activeRequests: 1,
  completedRequests: 3,
}

export const currentRequest = {
  id: 'REQ-2001',
  bloodGroup: 'O+',
  donationType: 'Whole Blood',
  units: 2,
  hospital: 'Dhaka Medical College',
  location: 'Dhanmondi, Dhaka',
  emergencyLevel: 'URGENT',
  status: 'WAITING RESPONSE',
  createdAt: '12 minutes ago',
  note: 'Urgent blood requirement for an admitted patient.',
}

export const matchedDonor = {
  bloodGroup: 'O+',
  donationType: 'Whole Blood',
  distance: 3.1,
  status: 'Matched',
}

export const completedRequests = [
  {
    id: 'REQ-1988',
    bloodGroup: 'B+',
    donationType: 'Platelets',
    units: 1,
    hospital: 'Square Hospital',
    status: 'COMPLETED',
    completedAt: '3 days ago',
  },
  {
    id: 'REQ-1941',
    bloodGroup: 'O+',
    donationType: 'Whole Blood',
    units: 2,
    hospital: 'United Hospital',
    status: 'COMPLETED',
    completedAt: '1 week ago',
  },
  {
    id: 'REQ-1902',
    bloodGroup: 'A+',
    donationType: 'Plasma',
    units: 1,
    hospital: 'Labaid Hospital',
    status: 'COMPLETED',
    completedAt: '2 weeks ago',
  },
]

export const patientNotifications = [
  {
    id: 'pnoti-1',
    message: 'BloodDrop started coordinating your request REQ-2001.',
    time: '5 min ago',
    unread: true,
  },
  {
    id: 'pnoti-2',
    message: 'A compatible donor was found for REQ-2001.',
    time: '18 min ago',
    unread: true,
  },
  {
    id: 'pnoti-3',
    message: 'Your previous request REQ-1988 was completed successfully.',
    time: 'Yesterday',
    unread: false,
  },
]

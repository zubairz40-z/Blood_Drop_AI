// Temporary frontend demo data.
// Replace with authenticated API profile data during backend integration.

export const demoDonor = {
  name: 'Demo User',
  phone: '+880 1XXXXXXXXX',
  bloodGroup: 'O+',
  age: 25,
  weight: 65,
  donationTypes: ['Whole Blood', 'Platelets'],
  eligibilityStatus: 'ELIGIBLE',
  nextEligibleDate: null,
  availability: true,
  totalDonations: 7,
  location: {
    mode: 'manual',
    address: '',
    latitude: null,
    longitude: null,
  },
}

export const bloodGroupOptions = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
]

export const donationTypeOptions = [
  { id: 'whole-blood', label: 'Whole Blood', description: 'Standard blood donation' },
  { id: 'plasma', label: 'Plasma', description: 'Liquid component of blood' },
  { id: 'platelets', label: 'Platelets', description: 'Blood clotting cells' },
  { id: 'double-red-cells', label: 'Double Red Cells', description: 'Concentrated red blood cells' },
]

export const nearbyRequests = [
  {
    id: 'REQ-1001',
    bloodGroup: 'O+',
    donationType: 'Platelets',
    hospital: 'Dhaka Medical College',
    distance: 2.4,
    emergency: 'CRITICAL',
  },
  {
    id: 'REQ-1002',
    bloodGroup: 'O+',
    donationType: 'Whole Blood',
    hospital: 'Square Hospital',
    distance: 5.8,
    emergency: 'URGENT',
  },
  {
    id: 'REQ-1003',
    bloodGroup: 'O+',
    donationType: 'Plasma',
    hospital: 'United Hospital',
    distance: 8.1,
    emergency: 'NORMAL',
  },
]

export const recentNotifications = [
  {
    id: 'noti-1',
    message: 'Emergency blood request from Dhaka Medical College — you are a match.',
    time: '5 min ago',
    unread: true,
  },
  {
    id: 'noti-2',
    message: 'You are now eligible to donate again. Thank you for your last donation!',
    time: '2 hours ago',
    unread: false,
  },
  {
    id: 'noti-3',
    message: 'Square Hospital confirmed your previous donation. Thank you!',
    time: 'Yesterday',
    unread: false,
  },
]

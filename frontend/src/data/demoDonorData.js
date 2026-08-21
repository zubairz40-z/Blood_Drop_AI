export const demoDonor = {
  name: 'Demo User',
  bloodGroup: 'O+',
  eligibilityStatus: 'ELIGIBLE',
  nextEligibleDate: null,
  availability: true,
  totalDonations: 7,
}

export const nearbyRequests = [
  {
    id: 'req-1',
    bloodGroup: 'O+',
    donationType: 'Platelets',
    hospital: 'Dhaka Medical College',
    distance: 2.4,
    emergency: 'CRITICAL',
  },
  {
    id: 'req-2',
    bloodGroup: 'O+',
    donationType: 'Whole Blood',
    hospital: 'Square Hospital',
    distance: 5.8,
    emergency: 'URGENT',
  },
  {
    id: 'req-3',
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

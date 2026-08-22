export const demoVolunteerTasks = [
  {
    id: 'REQ-V401',
    bloodGroup: 'O+',
    donationType: 'Whole Blood',
    units: 2,
    emergencyLevel: 'CRITICAL',
    hospital: 'Demo Hospital',
    hospitalLocation: 'Dhanmondi, Dhaka',
    distance: 3.6,
    status: 'ASSIGNED',
    assignedAt: '12 min ago',
  },
]

export const demoVolunteerCompletedTasks = [
  {
    id: 'TASK-501',
    requestId: 'REQ-V388',
    hospital: 'Square Hospital',
    assistanceType: 'Transport Donor',
    date: '20 Jul 2026',
    status: 'COMPLETED',
  },
  {
    id: 'TASK-497',
    requestId: 'REQ-V375',
    hospital: 'Dhaka Medical College',
    assistanceType: 'Guide Donor',
    date: '08 Jul 2026',
    status: 'COMPLETED',
  },
  {
    id: 'TASK-490',
    requestId: 'REQ-V362',
    hospital: 'United Hospital',
    assistanceType: 'Confirm Assistance',
    date: '22 Jun 2026',
    status: 'COMPLETED',
  },
]

export const demoVolunteerProfile = {
  name: 'Demo Volunteer',
  email: 'demo.volunteer@email.com',
  phone: '+880 1912345678',
  location: 'Dhanmondi, Dhaka',
  availability: true,
}

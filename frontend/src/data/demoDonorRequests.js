// Temporary frontend demo request data.
// Replace with API request data during backend integration.

export const demoDonorRequests = [
  {
    id: 'REQ-1001',
    bloodGroup: 'O+',
    donationType: 'Whole Blood',
    units: 2,
    hospital: 'Dhaka Medical College',
    distance: 2.4,
    emergencyLevel: 'CRITICAL',
    status: 'PENDING',
    location: 'Dhanmondi, Dhaka',
    requestedAt: '10 minutes ago',
    note: 'Urgent blood requirement for an admitted patient. Immediate donor response needed.',
  },
  {
    id: 'REQ-1002',
    bloodGroup: 'O+',
    donationType: 'Platelets',
    units: 1,
    hospital: 'Square Hospital',
    distance: 5.8,
    emergencyLevel: 'URGENT',
    status: 'PENDING',
    location: 'Gulshan, Dhaka',
    requestedAt: '25 minutes ago',
    note: 'Patient undergoing treatment requires platelet transfusion within the next few hours.',
  },
  {
    id: 'REQ-1003',
    bloodGroup: 'O+',
    donationType: 'Plasma',
    units: 1,
    hospital: 'United Hospital',
    distance: 8.1,
    emergencyLevel: 'NORMAL',
    status: 'PENDING',
    location: 'Banani, Dhaka',
    requestedAt: '1 hour ago',
    note: 'Scheduled plasma donation needed for ongoing patient care.',
  },
]

export const emergencyLevelConfig = {
  CRITICAL: { label: 'CRITICAL', variant: 'error', description: 'Requires immediate coordination.' },
  URGENT: { label: 'URGENT', variant: 'warning', description: 'Needed within the next few hours.' },
  NORMAL: { label: 'NORMAL', variant: 'info', description: 'Scheduled or routine request.' },
}

export const statusConfig = {
  PENDING: { label: 'Waiting for donor response', variant: 'warning' },
  ACCEPTED: { label: 'Accepted', variant: 'success' },
  DECLINED: { label: 'Declined', variant: 'error' },
}

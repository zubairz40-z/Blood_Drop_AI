export const demoPatientProfile = {
  name: 'Demo User',
  email: 'demo.patient@email.com',
  phone: '+880 1XXXXXXXXX',
  bloodGroup: 'O+',
  age: '34',
  location: {
    mode: 'manual',
    address: 'Dhanmondi, Dhaka',
    latitude: null,
    longitude: null,
  },
  emergencyContact: {
    name: 'Sarah Rahman',
    phone: '+880 1XXXXXXXXX',
    relationship: 'Spouse',
  },
  activeRequests: 1,
  completedRequests: 3,
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

export const relationshipOptions = [
  { value: 'Spouse', label: 'Spouse' },
  { value: 'Parent', label: 'Parent' },
  { value: 'Sibling', label: 'Sibling' },
  { value: 'Child', label: 'Child' },
  { value: 'Friend', label: 'Friend' },
  { value: 'Other', label: 'Other' },
]

// Temporary frontend demo map data.
// Positions are frontend canvas percentages, NOT GPS coordinates.
// No real Maps service or live tracking is connected.

export const demoMapData = {
  'REQ-2001': {
    requestId: 'REQ-2001',
    bloodGroup: 'O+',
    donationType: 'Whole Blood',
    units: 2,
    emergencyLevel: 'URGENT',

    request: {
      label: 'Blood Request',
      area: 'Dhanmondi, Dhaka',
      x: 48,
      y: 52,
    },

    hospital: {
      name: 'Dhaka Medical College',
      label: 'Hospital Destination',
      area: 'Dhanmondi, Dhaka',
      x: 60,
      y: 40,
    },

    donors: [
      {
        id: 'D-204',
        bloodGroup: 'O+',
        donationType: 'Whole Blood',
        distance: 3.1,
        availability: 'Available',
        status: 'BEST_MATCH',
        x: 32,
        y: 35,
      },
      {
        id: 'D-218',
        bloodGroup: 'O+',
        donationType: 'Whole Blood',
        distance: 4.6,
        availability: 'Available',
        status: 'COMPATIBLE',
        x: 22,
        y: 55,
      },
      {
        id: 'D-225',
        bloodGroup: 'O+',
        donationType: 'Platelets',
        distance: 6.2,
        availability: 'Busy',
        status: 'COMPATIBLE',
        x: 75,
        y: 62,
      },
      {
        id: 'D-231',
        bloodGroup: 'A+',
        donationType: 'Whole Blood',
        distance: 5.4,
        availability: 'Available',
        status: 'COMPATIBLE',
        x: 42,
        y: 22,
      },
    ],

    searchRadius: {
      centerX: 48,
      centerY: 48,
      radiusPercent: 30,
    },
  },
}

export const demoVolunteerMapData = {
  requestId: 'REQ-V401',
  bloodGroup: 'O+',
  emergencyLevel: 'CRITICAL',

  donor: {
    id: 'D-104',
    area: 'Mirpur, Dhaka',
    x: 30,
    y: 45,
  },

  hospital: {
    name: 'Demo Hospital',
    area: 'Dhanmondi, Dhaka',
    x: 65,
    y: 40,
  },

  distance: 3.6,
}

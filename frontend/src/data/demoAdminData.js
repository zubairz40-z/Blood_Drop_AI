// Temporary frontend demo analytics.
// Replace with backend analytics data later.

export const demoAdminStats = {
  totalUsers: 1248,
  activeDonors: 386,
  bloodRequests: 74,
  completedDonations: 912,
  averageResponseMinutes: 8.4,
}

export const demoRequestsByDay = [
  { day: 'Mon', count: 12 },
  { day: 'Tue', count: 18 },
  { day: 'Wed', count: 14 },
  { day: 'Thu', count: 21 },
  { day: 'Fri', count: 17 },
  { day: 'Sat', count: 25 },
  { day: 'Sun', count: 19 },
]

export const demoDonationsByGroup = [
  { bloodGroup: 'O+', count: 24 },
  { bloodGroup: 'O-', count: 8 },
  { bloodGroup: 'A+', count: 18 },
  { bloodGroup: 'A-', count: 6 },
  { bloodGroup: 'B+', count: 16 },
  { bloodGroup: 'B-', count: 5 },
  { bloodGroup: 'AB+', count: 9 },
  { bloodGroup: 'AB-', count: 3 },
]

export const demoAIAgents = [
  { name: 'AI Manager', status: 'READY' },
  { name: 'Donor Matching', status: 'READY' },
  { name: 'Eligibility & Scheduling', status: 'READY' },
  { name: 'Geo Coordination', status: 'READY' },
  { name: 'Risk & Advisor', status: 'MONITORING' },
]

export const demoRiskAlerts = [
  {
    id: 'risk-1',
    level: 'HIGH',
    title: 'Critical Request Load',
    description: 'Two critical demo requests are currently awaiting donor coordination.',
    area: 'Requests',
  },
  {
    id: 'risk-2',
    level: 'MEDIUM',
    title: 'O- Inventory Low',
    description: 'O- inventory is lower than other blood groups in the demo data.',
    area: 'Inventory',
  },
  {
    id: 'risk-3',
    level: 'LOW',
    title: 'Response Time Trend',
    description: 'Average response time increased slightly in the latest demo period.',
    area: 'Performance',
  },
]

export const demoRecentActivity = [
  { id: 'act-1', message: 'New blood request REQ-H301 created', time: '8 min ago' },
  { id: 'act-2', message: 'Donor D-108 confirmed for REQ-H302', time: '22 min ago' },
  { id: 'act-3', message: 'Donation DON-406 marked complete', time: '1 hour ago' },
  { id: 'act-4', message: 'Blood inventory updated by Demo Hospital', time: '2 hours ago' },
]

export const demoDonationsByMonth = [
  { month: 'Mar', count: 68 },
  { month: 'Apr', count: 74 },
  { month: 'May', count: 81 },
  { month: 'Jun', count: 76 },
  { month: 'Jul', count: 92 },
  { month: 'Aug', count: 88 },
]

export const demoDonationTypesBreakdown = [
  { type: 'Whole Blood', count: 142 },
  { type: 'Plasma', count: 98 },
  { type: 'Platelets', count: 76 },
  { type: 'Double Red Cells', count: 34 },
]

export const demoEmergencyBreakdown = [
  { level: 'NORMAL', count: 28 },
  { level: 'URGENT', count: 31 },
  { level: 'CRITICAL', count: 15 },
]

export const demoRiskSummary = {
  systemRisk: 'LOW',
  suspiciousActivities: 2,
  recommendations: 4,
}

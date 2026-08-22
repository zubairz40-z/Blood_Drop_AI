import {
  LayoutDashboard,
  User,
  AlertTriangle,
  History,
  Bell,
  FilePlus,
  List,
  Users,
  Package,
  HandHeart,
  BarChart3,
  Bot,
  ShieldAlert,
  DollarSign,
} from 'lucide-react'

export const dashboardNavigation = {
  donor: [
    { label: 'Dashboard', path: '/donor', icon: LayoutDashboard },
    { label: 'Profile', path: '/donor/profile', icon: User },
    { label: 'Emergency Requests', path: '/donor/requests', icon: AlertTriangle },
    { label: 'Donation History', path: '/donor/history', icon: History },
    { label: 'Notifications', path: '/donor/notifications', icon: Bell },
  ],
  patient: [
    { label: 'Dashboard', path: '/patient', icon: LayoutDashboard },
    { label: 'Create Request', path: '/patient/requests/create', icon: FilePlus },
    { label: 'My Requests', path: '/patient/requests', icon: List },
    { label: 'Profile', path: '/patient/profile', icon: User },
    { label: 'Notifications', path: '/patient/notifications', icon: Bell },
  ],
  hospital: [
    { label: 'Dashboard', path: '/hospital', icon: LayoutDashboard },
    { label: 'Blood Requests', path: '/hospital/requests', icon: List },
    { label: 'Matched Donors', path: '/hospital/matches', icon: Users },
    { label: 'Blood Inventory', path: '/hospital/inventory', icon: Package },
    { label: 'Donations', path: '/hospital/donations', icon: HandHeart },
    { label: 'Notifications', path: '/hospital/notifications', icon: Bell },
  ],
  volunteer: [
    { label: 'Dashboard', path: '/volunteer', icon: LayoutDashboard },
    { label: 'Assigned Tasks', path: '/volunteer/tasks', icon: HandHeart },
    { label: 'Assistance History', path: '/volunteer/history', icon: History },
    { label: 'Notifications', path: '/volunteer/notifications', icon: Bell },
    { label: 'Profile', path: '/volunteer/profile', icon: User },
  ],
  admin: [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Blood Requests', path: '/admin/requests', icon: List },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'AI System', path: '/admin/ai-system', icon: Bot },
    { label: 'Risk Alerts', path: '/admin/risk-alerts', icon: ShieldAlert },
    { label: 'Notifications', path: '/admin/notifications', icon: Bell },
    { label: 'Funding', path: '/admin/funding', icon: DollarSign },
  ],
}

export const roleLabels = {
  donor: 'Donor',
  patient: 'Patient',
  hospital: 'Hospital',
  volunteer: 'Volunteer',
  admin: 'Admin',
}

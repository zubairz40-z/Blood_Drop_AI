import { Routes, Route } from 'react-router-dom'
import Home from '../pages/Home'
import DesignSystem from '../pages/DesignSystem'
import Funding from '../pages/Funding'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import ForgotPassword from '../pages/auth/ForgotPassword'
import DashboardLayout from '../layouts/DashboardLayout'
import DonorDashboard from '../pages/donor/DonorDashboard'
import DonorProfile from '../pages/donor/DonorProfile'
import DonorEmergencyRequests from '../pages/donor/DonorEmergencyRequests'
import DonorEmergencyRequestDetails from '../pages/donor/DonorEmergencyRequestDetails'
import DonorDonationHistory from '../pages/donor/DonorDonationHistory'
import PatientDashboard from '../pages/patient/PatientDashboard'
import CreateBloodRequest from '../pages/patient/CreateBloodRequest'
import PatientRequests from '../pages/patient/PatientRequests'
import RequestTracking from '../pages/patient/RequestTracking'
import AICoordination from '../pages/patient/AICoordination'
import PatientProfile from '../pages/patient/PatientProfile'
import RequestMap from '../pages/patient/RequestMap'
import HospitalDashboard from '../pages/hospital/HospitalDashboard'
import HospitalRequests from '../pages/hospital/HospitalRequests'
import HospitalMatches from '../pages/hospital/HospitalMatches'
import HospitalInventoryPage from '../pages/hospital/HospitalInventoryPage'
import HospitalDonations from '../pages/hospital/HospitalDonations'
import VolunteerDashboard from '../pages/volunteer/VolunteerDashboard'
import VolunteerTasks from '../pages/volunteer/VolunteerTasks'
import VolunteerAssistanceHistory from '../pages/volunteer/VolunteerAssistanceHistory'
import VolunteerProfile from '../pages/volunteer/VolunteerProfile'
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminUsers from '../pages/admin/AdminUsers'
import AdminBloodRequests from '../pages/admin/AdminBloodRequests'
import AdminAnalytics from '../pages/admin/AdminAnalytics'
import AdminAISystem from '../pages/admin/AdminAISystem'
import AdminRiskAlerts from '../pages/admin/AdminRiskAlerts'
import AdminFunding from '../pages/admin/AdminFunding'
import NotificationsPage from '../pages/notifications/NotificationsPage'
import NotFound from '../pages/NotFound'
import ProtectedRoute from '../components/auth/ProtectedRoute'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/design-system" element={<DesignSystem />} />
      <Route path="/funding" element={<Funding />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route
        path="/donor"
        element={
          <ProtectedRoute role="donor">
            <DashboardLayout role="donor" />
          </ProtectedRoute>
        }
      >
        <Route index element={<DonorDashboard />} />
        <Route path="profile" element={<DonorProfile />} />
        <Route path="requests" element={<DonorEmergencyRequests />} />
        <Route path="requests/:requestId" element={<DonorEmergencyRequestDetails />} />
        <Route path="history" element={<DonorDonationHistory />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route
        path="/patient"
        element={
          <ProtectedRoute role="patient">
            <DashboardLayout role="patient" />
          </ProtectedRoute>
        }
      >
        <Route index element={<PatientDashboard />} />
        <Route path="requests/create" element={<CreateBloodRequest />} />
        <Route path="requests" element={<PatientRequests />} />
        <Route path="requests/:requestId/tracking" element={<RequestTracking />} />
        <Route path="requests/:requestId/coordination" element={<AICoordination />} />
        <Route path="requests/:requestId/map" element={<RequestMap />} />
        <Route path="profile" element={<PatientProfile />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route
        path="/hospital"
        element={
          <ProtectedRoute role="hospital">
            <DashboardLayout role="hospital" />
          </ProtectedRoute>
        }
      >
        <Route index element={<HospitalDashboard />} />
        <Route path="requests" element={<HospitalRequests />} />
        <Route path="matches" element={<HospitalMatches />} />
        <Route path="inventory" element={<HospitalInventoryPage />} />
        <Route path="donations" element={<HospitalDonations />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route
        path="/volunteer"
        element={
          <ProtectedRoute role="volunteer">
            <DashboardLayout role="volunteer" />
          </ProtectedRoute>
        }
      >
        <Route index element={<VolunteerDashboard />} />
        <Route path="tasks" element={<VolunteerTasks />} />
        <Route path="history" element={<VolunteerAssistanceHistory />} />
        <Route path="profile" element={<VolunteerProfile />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <DashboardLayout role="admin" />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="requests" element={<AdminBloodRequests />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="ai-system" element={<AdminAISystem />} />
        <Route path="risk-alerts" element={<AdminRiskAlerts />} />
        <Route path="funding" element={<AdminFunding />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes

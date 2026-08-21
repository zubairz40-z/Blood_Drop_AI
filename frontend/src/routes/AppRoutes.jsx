import { Routes, Route } from 'react-router-dom'
import Home from '../pages/Home'
import DesignSystem from '../pages/DesignSystem'
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import ForgotPassword from '../pages/auth/ForgotPassword'
import DashboardLayout from '../layouts/DashboardLayout'
import DashboardPlaceholder from '../components/dashboard/DashboardPlaceholder'
import DonorDashboard from '../pages/donor/DonorDashboard'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/design-system" element={<DesignSystem />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/donor" element={<DashboardLayout role="donor" />}>
        <Route index element={<DonorDashboard />} />
      </Route>
      <Route path="/patient" element={<DashboardLayout role="patient" />}>
        <Route index element={<DashboardPlaceholder title="Patient Dashboard" description="Patient dashboard content will be added in a later step." role="Patient" />} />
      </Route>
      <Route path="/hospital" element={<DashboardLayout role="hospital" />}>
        <Route index element={<DashboardPlaceholder title="Hospital Dashboard" description="Hospital dashboard content will be added in a later step." role="Hospital" />} />
      </Route>
      <Route path="/volunteer" element={<DashboardLayout role="volunteer" />}>
        <Route index element={<DashboardPlaceholder title="Volunteer Dashboard" description="Volunteer dashboard content will be added in a later step." role="Volunteer" />} />
      </Route>
      <Route path="/admin" element={<DashboardLayout role="admin" />}>
        <Route index element={<DashboardPlaceholder title="Admin Dashboard" description="Admin dashboard content will be added in a later step." role="Admin" />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes

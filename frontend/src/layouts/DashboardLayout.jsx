import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import DashboardSidebar from '../components/dashboard/DashboardSidebar'
import DashboardTopbar from '../components/dashboard/DashboardTopbar'
import MobileDashboardSidebar from '../components/dashboard/MobileDashboardSidebar'
import { dashboardNavigation, roleLabels } from '../config/dashboardNavigation'

function DashboardLayout({ role = 'donor' }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigation = dashboardNavigation[role] || []
  const roleLabel = roleLabels[role] || role

  return (
    <div className="min-h-screen bg-bg">
      <DashboardSidebar navigation={navigation} roleLabel={roleLabel} />

      <MobileDashboardSidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        navigation={navigation}
        roleLabel={roleLabel}
      />

      <div className="lg:pl-[260px]">
        <DashboardTopbar
          roleLabel={roleLabel}
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout

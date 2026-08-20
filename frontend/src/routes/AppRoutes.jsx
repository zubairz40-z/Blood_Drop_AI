import { Routes, Route } from 'react-router-dom'
import Home from '../pages/Home'
import DesignSystem from '../pages/DesignSystem'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/design-system" element={<DesignSystem />} />
    </Routes>
  )
}

export default AppRoutes

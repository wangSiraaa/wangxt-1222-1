import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import WaterLevelPage from '@/pages/WaterLevelPage'
import GateSchedulePage from '@/pages/GateSchedulePage'
import GateActualPage from '@/pages/GateActualPage'
import EcologicalFlowPage from '@/pages/EcologicalFlowPage'
import WaterSupplyPage from '@/pages/WaterSupplyPage'
import ApprovalPage from '@/pages/ApprovalPage'
import WarningPage from '@/pages/WarningPage'
import ScheduleDetailPage from '@/pages/ScheduleDetailPage'

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/water-level" element={<WaterLevelPage />} />
          <Route path="/gate-schedule" element={<GateSchedulePage />} />
          <Route path="/gate-schedule/:id" element={<ScheduleDetailPage />} />
          <Route path="/gate-actual" element={<GateActualPage />} />
          <Route path="/ecological" element={<EcologicalFlowPage />} />
          <Route path="/water-supply" element={<WaterSupplyPage />} />
          <Route path="/approval" element={<ApprovalPage />} />
          <Route path="/warning" element={<WarningPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App

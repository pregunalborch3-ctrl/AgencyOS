import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider }         from './contexts/AuthContext'
import { SubscriptionProvider } from './contexts/SubscriptionContext'
import ProtectedRoute           from './components/ProtectedRoute'
import Layout                   from './components/Layout/Layout'
import Landing                  from './pages/Landing'
import Login                    from './pages/Login'
import Register                 from './pages/Register'
import CampaignApp              from './pages/CampaignApp'
import Settings                 from './pages/Settings'
import SubscriptionSuccess      from './pages/SubscriptionSuccess'
import SubscriptionCanceled     from './pages/SubscriptionCanceled'
import HistorialPage            from './pages/HistorialPage'
import Home                    from './pages/Home'
import MarketAnalysis          from './pages/frameworks/MarketAnalysis'
import CompetitionMap          from './pages/frameworks/CompetitionMap'
import DistributionPlan        from './pages/frameworks/DistributionPlan'
import ViralContent            from './pages/frameworks/ViralContent'
import ScalingRoadmap          from './pages/frameworks/ScalingRoadmap'
import Privacy                 from './pages/legal/Privacy'
import Terms                   from './pages/legal/Terms'
import Cookies                 from './pages/legal/Cookies'
import NotFound                from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SubscriptionProvider>
          <Routes>
            {/* Public */}
            <Route path="/"         element={<Landing />} />
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/privacy"  element={<Privacy />} />
            <Route path="/terms"    element={<Terms />} />
            <Route path="/cookies"  element={<Cookies />} />

            {/* Protected */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/subscription/success"  element={<SubscriptionSuccess />} />
                <Route path="/subscription/canceled" element={<SubscriptionCanceled />} />
                <Route path="/settings"              element={<Settings />} />

                <Route path="/home"                      element={<Home />} />
                <Route path="/frameworks/mercado"      element={<MarketAnalysis />} />
                <Route path="/frameworks/competencia"  element={<CompetitionMap />} />
                <Route path="/frameworks/distribucion" element={<DistributionPlan />} />
                <Route path="/frameworks/contenido"    element={<ViralContent />} />
                <Route path="/frameworks/escalado"     element={<ScalingRoadmap />} />
                {/* Main app — paywall handled in-app */}
                <Route path="/dashboard" element={<CampaignApp />} />
                <Route path="/historial" element={<HistorialPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </SubscriptionProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

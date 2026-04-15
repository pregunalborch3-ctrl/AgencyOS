import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

            {/* Protected */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/subscription/success"  element={<SubscriptionSuccess />} />
                <Route path="/subscription/canceled" element={<SubscriptionCanceled />} />
                <Route path="/settings"              element={<Settings />} />

                {/* Main app — paywall handled in-app */}
                <Route path="/dashboard" element={<CampaignApp />} />
                <Route path="/historial" element={<HistorialPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SubscriptionProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

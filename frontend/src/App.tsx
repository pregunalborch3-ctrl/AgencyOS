import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }         from './contexts/AuthContext'
import { SubscriptionProvider } from './contexts/SubscriptionContext'
import ProtectedRoute           from './components/ProtectedRoute'
import SubscriptionRoute        from './components/SubscriptionRoute'
import Layout                   from './components/Layout/Layout'
import Landing                  from './pages/Landing'
import Login                    from './pages/Login'
import Register                 from './pages/Register'
import Dashboard                from './pages/Dashboard'
import CampaignGenerator        from './pages/CampaignGenerator'
import Settings                 from './pages/Settings'
import SubscriptionSuccess      from './pages/SubscriptionSuccess'
import SubscriptionCanceled     from './pages/SubscriptionCanceled'

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
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/subscription/success"  element={<SubscriptionSuccess />} />
                <Route path="/subscription/canceled" element={<SubscriptionCanceled />} />

                {/* Subscription-gated */}
                <Route element={<SubscriptionRoute />}>
                  <Route path="/campaigns" element={<CampaignGenerator />} />
                </Route>

                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SubscriptionProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

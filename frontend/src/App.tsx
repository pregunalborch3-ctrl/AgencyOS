import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SubscriptionProvider } from './contexts/SubscriptionContext'
import ProtectedRoute from './components/ProtectedRoute'
import SubscriptionRoute from './components/SubscriptionRoute'
import Layout from './components/Layout/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ContentGenerator from './pages/ContentGenerator'
import PublicationCalendar from './pages/PublicationCalendar'
import BudgetCalculator from './pages/BudgetCalculator'
import BriefingTemplate from './pages/BriefingTemplate'
import CompetitorAnalyzer from './pages/CompetitorAnalyzer'
import Settings from './pages/Settings'
import SubscriptionSuccess from './pages/SubscriptionSuccess'
import SubscriptionCanceled from './pages/SubscriptionCanceled'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SubscriptionProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/subscription/success"  element={<SubscriptionSuccess />} />
                <Route path="/subscription/canceled" element={<SubscriptionCanceled />} />

                {/* Subscription-gated tools */}
                <Route element={<SubscriptionRoute />}>
                  <Route path="/content"    element={<ContentGenerator />} />
                  <Route path="/calendar"   element={<PublicationCalendar />} />
                  <Route path="/budget"     element={<BudgetCalculator />} />
                  <Route path="/briefing"   element={<BriefingTemplate />} />
                  <Route path="/competitor" element={<CompetitorAnalyzer />} />
                </Route>

                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SubscriptionProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

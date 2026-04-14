import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Zap } from 'lucide-react'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl gradient-indigo flex items-center justify-center shadow-lg shadow-indigo-200 animate-pulse">
          <Zap size={22} className="text-white" />
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <LoadingScreen />
  if (!user)    return <Navigate to="/login" replace />
  return <Outlet />
}

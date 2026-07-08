import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

export function ProtectedRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (user.must_change_password) return <Navigate to="/change-password" replace />

  return <Outlet />
}

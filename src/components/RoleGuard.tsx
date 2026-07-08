import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import type { Role } from "@/types"

interface Props {
  allowedRoles: Role[]
}

export function RoleGuard({ allowedRoles }: Props) {
  const { user } = useAuth()
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}

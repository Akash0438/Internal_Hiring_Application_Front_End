import { Routes, Route, Navigate } from "react-router-dom"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { RoleGuard } from "@/components/RoleGuard"
import { DashboardLayout } from "@/layouts/DashboardLayout"

import LandingPage from "@/pages/LandingPage"
import LoginPage from "@/pages/LoginPage"
import ChangePasswordPage from "@/pages/ChangePasswordPage"
import DashboardPage from "@/pages/DashboardPage"
import CandidatesPage from "@/pages/CandidatesPage"
import CandidateDetailPage from "@/pages/CandidateDetailPage"
import AssignmentsPage from "@/pages/AssignmentsPage"
import FeedbackPage from "@/pages/FeedbackPage"
import UsersPage from "@/pages/UsersPage"
import ProfilePage from "@/pages/ProfilePage"

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />

      {/* Protected routes — require authentication */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/candidates" element={<CandidatesPage />} />
          <Route path="/candidates/:id" element={<CandidateDetailPage />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
          <Route path="/feedback/:assignmentId" element={<FeedbackPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Admin-only */}
          <Route element={<RoleGuard allowedRoles={["ADMIN"]} />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

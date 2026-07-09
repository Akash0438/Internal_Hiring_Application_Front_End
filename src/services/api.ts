import api from "@/lib/axios"
import type {
  AssignmentResponse,
  BulkUploadResult,
  CandidateDetail,
  CandidateResponse,
  FeedbackResponse,
  NotificationResponse,
  TokenUserResponse,
  UserResponse,
} from "@/types"

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<TokenUserResponse>("/api/auth/login", { email, password }),

  logout: () => api.post("/api/auth/logout"),

  me: () => api.get<UserResponse>("/api/auth/me"),

  changePassword: (new_password: string, current_password?: string) =>
    api.post<TokenUserResponse>("/api/auth/change-password", { new_password, current_password }),
}

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: () => api.get<UserResponse[]>("/api/users/"),

  /** List active Hiring Managers — accessible by Portfolio Managers + Admins */
  listHiringManagers: () => api.get<UserResponse[]>("/api/users/hiring-managers"),

  /** List active Hiring Managers AND Portfolio Managers — for the Assign Interview dropdown */
  listAssignableUsers: () => api.get<UserResponse[]>("/api/users/assignable-users"),

  create: (data: { name: string; email: string; phone?: string; role: string }) =>
    api.post<UserResponse>("/api/users/", data),

  update: (id: string, data: Partial<UserResponse>) =>
    api.patch<UserResponse>(`/api/users/${id}`, data),

  resetPassword: (id: string) => api.post(`/api/users/${id}/reset-password`),
}

// ── Candidates ────────────────────────────────────────────────────────────────
export const candidatesApi = {
  list: () => api.get<CandidateResponse[]>("/api/candidates/"),

  get: (id: string) => api.get<CandidateDetail>(`/api/candidates/${id}`),

  create: (data: {
    employee_id: string
    candidate_name: string
    email: string
    phone?: string
    position: string
    experience?: string
    current_location?: string
    pay_band_level?: string
    resume_url?: string
  }) => api.post<CandidateResponse>("/api/candidates/", data),

  update: (id: string, data: Partial<CandidateResponse>) =>
    api.patch<CandidateResponse>(`/api/candidates/${id}`, data),

  decision: (id: string, decision: "APPROVED" | "REJECTED" | "ON_HOLD") =>
    api.post(`/api/candidates/${id}/decision`, { decision }),

  /** Download the CSV template file */
  downloadTemplate: () =>
    api.get("/api/candidates/bulk-upload/template", { responseType: "blob" }),

  /** Upload a CSV or XLSX file; returns per-row results */
  bulkUpload: (file: File) => {
    const form = new FormData()
    form.append("file", file)
    return api.post<BulkUploadResult>("/api/candidates/bulk-upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  },
}

// ── Interviews ────────────────────────────────────────────────────────────────
export const interviewsApi = {
  assign: (candidate_id: string, hiring_manager_id: string) =>
    api.post<AssignmentResponse>("/api/interviews/assign", {
      candidate_id,
      hiring_manager_id,
    }),

  /** Portfolio Manager self-assigns as interviewer for the candidate */
  selfAssign: (candidate_id: string) =>
    api.post<AssignmentResponse>("/api/interviews/self-assign", { candidate_id }),

  list: () => api.get<AssignmentResponse[]>("/api/interviews/assigned"),

  reassign: (id: string, hiring_manager_id: string) =>
    api.patch<AssignmentResponse>(`/api/interviews/${id}/reassign`, {
      hiring_manager_id,
    }),
}

// ── Feedback ──────────────────────────────────────────────────────────────────
export const feedbackApi = {
  submit: (data: {
    assignment_id: string
    rating: number
    feedback: string
    recommendation: string
  }) => api.post<FeedbackResponse>("/api/feedback/", data),

  get: (assignment_id: string) =>
    api.get<FeedbackResponse>(`/api/feedback/${assignment_id}`),
}

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: (unread_only = false) =>
    api.get<NotificationResponse[]>(
      `/api/notifications/${unread_only ? "?unread_only=true" : ""}`
    ),

  markRead: (id: string) => api.patch(`/api/notifications/${id}/read`),

  markAllRead: () => api.patch("/api/notifications/read-all"),

  /** Permanently delete a single notification from the DB */
  dismiss: (id: string) => api.delete(`/api/notifications/${id}`),

  /** Permanently delete all read notifications from the DB */
  dismissAllRead: () => api.delete("/api/notifications/"),
}

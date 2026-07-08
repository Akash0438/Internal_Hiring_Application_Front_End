// All shared TypeScript types mirroring backend Pydantic schemas

export type Role = "ADMIN" | "PORTFOLIO_MANAGER" | "HIRING_MANAGER"

export type CandidateStatus =
  | "NEW"
  | "ASSIGNED"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEW_COMPLETED"
  | "FEEDBACK_SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "ON_HOLD"

export type AssignmentStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED"

export type Recommendation =
  | "STRONGLY_RECOMMEND"
  | "RECOMMEND"
  | "NEUTRAL"
  | "DO_NOT_RECOMMEND"

export interface UserResponse {
  id: string
  name: string
  email: string
  phone?: string
  role: Role
  must_change_password: boolean
  can_create_portfolio_managers: boolean
  is_active: boolean
  created_at?: string
}

export interface CandidateResponse {
  id: string
  employee_id: string
  candidate_name: string
  email: string
  phone?: string
  position: string
  experience?: string
  current_location?: string
  pay_band_level?: string
  resume_url?: string
  status: CandidateStatus
  created_by_id: string
  created_at: string
  updated_at: string
}

export interface AssignmentResponse {
  id: string
  candidate_id: string
  candidate_name?: string
  candidate_employee_id?: string
  candidate_pay_band?: string
  portfolio_manager_id: string
  hiring_manager_id: string
  hiring_manager_name?: string
  assigned_date: string
  status: AssignmentStatus
  is_self_assigned: boolean
}

export interface FeedbackResponse {
  id: string
  assignment_id: string
  rating: number
  feedback: string
  recommendation: Recommendation
  submitted_at: string
}

export interface NotificationResponse {
  id: string
  message: string
  is_read: boolean
  created_at: string
}

export interface BulkUploadRow {
  row: number
  email: string
  candidate_name?: string
  reason?: string
}

export interface BulkUploadResult {
  summary: {
    total_rows: number
    created: number
    skipped: number
    errors: number
  }
  created: BulkUploadRow[]
  skipped: BulkUploadRow[]
  errors: BulkUploadRow[]
}

export interface CandidateDetail {
  candidate: CandidateResponse
  assignments: Array<{
    id: string
    status: AssignmentStatus
    assigned_date: string
    hiring_manager_id: string
  }>
  feedback: Array<{
    id: string
    assignment_id: string
    rating: number
    recommendation: Recommendation
    submitted_at: string
  }>
}

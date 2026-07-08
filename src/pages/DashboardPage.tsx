import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { candidatesApi, interviewsApi } from "@/services/api"
import { useAuth } from "@/context/AuthContext"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, ClipboardList, CheckCircle, Clock, ArrowRight, TrendingUp } from "lucide-react"
import type { CandidateResponse, AssignmentResponse } from "@/types"

const statusConfig: Record<string, { color: string; label: string }> = {
  NEW:                { color: "bg-slate-100 text-slate-700",  label: "New" },
  ASSIGNED:           { color: "bg-blue-100 text-blue-700",   label: "Assigned" },
  INTERVIEW_SCHEDULED:{ color: "bg-purple-100 text-purple-700", label: "Scheduled" },
  FEEDBACK_SUBMITTED: { color: "bg-amber-100 text-amber-800", label: "Feedback In" },
  UNDER_REVIEW:       { color: "bg-orange-100 text-orange-700", label: "Under Review" },
  APPROVED:           { color: "bg-emerald-100 text-emerald-700", label: "Approved" },
  REJECTED:           { color: "bg-red-100 text-red-700",     label: "Rejected" },
  ON_HOLD:            { color: "bg-amber-100 text-amber-700", label: "On Hold" },
}

const statCards = [
  {
    key: "total",
    title: "Total Candidates",
    icon: Users,
    gradient: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    iconColor: "text-blue-500",
    description: "All candidates",
  },
  {
    key: "pending",
    title: "Pending Interviews",
    icon: Clock,
    gradient: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
    iconColor: "text-amber-500",
    description: "Awaiting interview",
  },
  {
    key: "inProgress",
    title: "In Progress",
    icon: TrendingUp,
    gradient: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    iconColor: "text-violet-500",
    description: "Currently interviewing",
  },
  {
    key: "completed",
    title: "Completed",
    icon: CheckCircle,
    gradient: "from-emerald-500 to-green-600",
    bg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    description: "Interviews done",
  },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: candidates = [] } = useQuery({
    queryKey: ["candidates"],
    queryFn: () => candidatesApi.list().then((r) => r.data),
  })

  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments"],
    queryFn: () => interviewsApi.list().then((r) => r.data),
  })

  const pending = (assignments as AssignmentResponse[]).filter((a) => a.status === "PENDING").length
  const completed = (assignments as AssignmentResponse[]).filter((a) => a.status === "COMPLETED").length
  const inProgress = (assignments as AssignmentResponse[]).filter((a) => a.status === "IN_PROGRESS").length
  const counts: Record<string, number> = { total: candidates.length, pending, inProgress, completed }

  const statusCounts = (candidates as CandidateResponse[]).reduce(
    (acc, c) => { acc[c.status] = (acc[c.status] ?? 0) + 1; return acc },
    {} as Record<string, number>
  )

  const roleLabel = user?.role === "ADMIN" ? "Admin" : user?.role === "PORTFOLIO_MANAGER" ? "Portfolio Manager" : "Hiring Manager"

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 text-white p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.name}! 👋</h1>
          <p className="text-blue-100 mt-1 text-sm">{roleLabel} · Here's your overview for today.</p>
        </div>
        {user?.role !== "ADMIN" && (
          <Button
            variant="secondary"
            className="gap-2 bg-white/20 hover:bg-white/30 text-white border-0 hidden sm:flex"
            onClick={() => navigate(user?.role === "PORTFOLIO_MANAGER" ? "/candidates" : "/assignments")}
          >
            {user?.role === "PORTFOLIO_MANAGER" ? "View Candidates" : "My Assignments"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ key, title, icon: Icon, bg, iconColor, description }) => (
          <div key={key} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <span className="text-3xl font-extrabold text-slate-800">{counts[key]}</span>
            </div>
            <p className="font-semibold text-slate-700 text-sm">{title}</p>
            <p className="text-xs text-slate-400 mt-0.5">{description}</p>
          </div>
        ))}
      </div>

      {/* Candidate status breakdown */}
      {(candidates as CandidateResponse[]).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-blue-500" />
              Candidate Status Breakdown
            </h2>
            {user?.role !== "ADMIN" && (
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-blue-600 hover:text-blue-700" onClick={() => navigate("/candidates")}>
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusCounts).map(([status, count]) => {
              const cfg = statusConfig[status] ?? { color: "bg-slate-100 text-slate-700", label: status }
              return (
                <Badge key={status} className={`${cfg.color} gap-1 font-medium px-3 py-1`}>
                  <span>{cfg.label}</span>
                  <span className="font-bold">{count}</span>
                </Badge>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      {user?.role === "PORTFOLIO_MANAGER" && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <button
              onClick={() => navigate("/candidates")}
              className="flex flex-col gap-2 p-4 rounded-xl border-2 border-dashed border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-colors text-left"
            >
              <Users className="h-5 w-5" />
              <p className="text-sm font-semibold">Add Candidate</p>
              <p className="text-xs text-slate-400">Create a new candidate profile</p>
            </button>
            <button
              onClick={() => navigate("/assignments")}
              className="flex flex-col gap-2 p-4 rounded-xl border-2 border-dashed border-violet-200 text-violet-600 hover:bg-violet-50 hover:border-violet-400 transition-colors text-left"
            >
              <ClipboardList className="h-5 w-5" />
              <p className="text-sm font-semibold">Assignments</p>
              <p className="text-xs text-slate-400">View and manage interviews</p>
            </button>
            <button
              onClick={() => navigate("/candidates")}
              className="flex flex-col gap-2 p-4 rounded-xl border-2 border-dashed border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400 transition-colors text-left"
            >
              <CheckCircle className="h-5 w-5" />
              <p className="text-sm font-semibold">Review Feedback</p>
              <p className="text-xs text-slate-400">Make hiring decisions</p>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

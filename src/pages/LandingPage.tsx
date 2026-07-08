import { useNavigate } from "react-router-dom"
import { Users, ClipboardList, CheckCircle, ArrowRight, Star, Zap, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

const features = [
  {
    icon: Users,
    title: "Smart User Management",
    desc: "Admins create and manage Portfolio Managers and Hiring Managers with role-based access.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: ClipboardList,
    title: "Streamlined Assignments",
    desc: "Portfolio Managers assign candidates to interviewers in seconds and track every stage.",
    color: "bg-violet-50 text-violet-600",
  },
  {
    icon: CheckCircle,
    title: "Structured Feedback",
    desc: "Hiring Managers submit detailed feedback with ratings and recommendations after each interview.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Star,
    title: "Hiring Decisions",
    desc: "Portfolio Managers review feedback and Approve, Reject or Hold candidates at any time.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Zap,
    title: "Instant Notifications",
    desc: "Real-time in-app and email notifications keep everyone in sync at every step.",
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: Shield,
    title: "Secure & Role-Gated",
    desc: "Every action is protected by JWT auth and strict role-based access control.",
    color: "bg-cyan-50 text-cyan-600",
  },
]

const steps = [
  { num: "01", label: "Admin creates users", sub: "Portfolio Managers & Hiring Managers get a welcome email with a temp password." },
  { num: "02", label: "Candidate is added", sub: "Portfolio Manager creates a candidate profile with all relevant details." },
  { num: "03", label: "Interview assigned", sub: "The candidate is assigned to a Hiring Manager (or self-assigned)." },
  { num: "04", label: "Feedback submitted", sub: "After the interview the Hiring Manager rates and recommends." },
  { num: "05", label: "Decision made", sub: "Portfolio Manager reviews feedback and marks Approved, Rejected or On Hold." },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm">IP</div>
            <span className="font-bold text-slate-800">Interview Platform</span>
          </div>
          <Button onClick={() => navigate("/login")} className="gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 border-0">
            Sign In <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-violet-700 text-white py-24 px-6">
        {/* decorative circles */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5" />
        <div className="relative max-w-3xl mx-auto text-center space-y-6">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest bg-white/20 px-4 py-1.5 rounded-full">
            End-to-End Interview Management
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
            Hire smarter.<br className="hidden sm:block" /> Interview faster.
          </h1>
          <p className="text-blue-100 text-lg max-w-xl mx-auto leading-relaxed">
            A unified platform for Portfolio Managers and Hiring Managers to create, assign, track, and decide on candidates — all in one place.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button
              size="lg"
              onClick={() => navigate("/login")}
              className="gap-2 bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-lg"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800">Everything you need</h2>
            <p className="text-slate-500 mt-2">Designed to remove friction from your hiring workflow.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800">How it works</h2>
            <p className="text-slate-500 mt-2">Five simple steps from signup to hiring decision.</p>
          </div>
          <div className="space-y-4">
            {steps.map(({ num, label, sub }) => (
              <div key={num} className="flex items-start gap-5 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <div className="shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                  {num}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{label}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-center">
        <h2 className="text-3xl font-bold mb-3">Ready to streamline your interviews?</h2>
        <p className="text-blue-100 mb-8 max-w-md mx-auto">Sign in with your credentials and start managing candidates today.</p>
        <Button
          size="lg"
          onClick={() => navigate("/login")}
          className="gap-2 bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-lg"
        >
          Sign In Now <ArrowRight className="h-4 w-4" />
        </Button>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="py-6 px-6 border-t text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Interview Management Platform. All rights reserved.
      </footer>
    </div>
  )
}

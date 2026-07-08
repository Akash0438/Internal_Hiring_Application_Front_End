import { Link, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  UserCheck,
  ClipboardList,
  User,
} from "lucide-react"

const allLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "PORTFOLIO_MANAGER", "HIRING_MANAGER"], color: "text-blue-400" },
  { href: "/users", label: "User Management", icon: Users, roles: ["ADMIN"], color: "text-rose-400" },
  { href: "/candidates", label: "Candidates", icon: UserCheck, roles: ["PORTFOLIO_MANAGER", "HIRING_MANAGER"], color: "text-emerald-400" },
  { href: "/assignments", label: "Assignments", icon: ClipboardList, roles: ["PORTFOLIO_MANAGER", "HIRING_MANAGER"], color: "text-amber-400" },
  { href: "/profile", label: "Profile", icon: User, roles: ["ADMIN", "PORTFOLIO_MANAGER", "HIRING_MANAGER"], color: "text-violet-400" },
]

export default function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()

  const links = allLinks.filter((l) => user && l.roles.includes(user.role))

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center font-bold text-sm shrink-0">
          IP
        </div>
        <div className="leading-tight">
          <p className="font-bold text-sm text-white">Interview</p>
          <p className="text-xs text-slate-400">Platform</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {links.map(({ href, label, icon: Icon, color }) => {
          const active = location.pathname === href || location.pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              to={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-slate-400 hover:bg-white/8 hover:text-white"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : color)} />
              {label}
              {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom role chip */}
      {user && (
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-xs font-bold shrink-0">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">
                {user.role === "ADMIN" ? "Admin" : user.role === "PORTFOLIO_MANAGER" ? "Portfolio Manager" : "Hiring Manager"}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

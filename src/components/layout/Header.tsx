import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Bell, LogOut, User, CheckCheck, X, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { notificationsApi } from "@/services/api"
import { useAuth } from "@/context/AuthContext"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { NotificationResponse } from "@/types"

function roleBadgeColor(role: string) {
  if (role === "ADMIN") return "bg-red-100 text-red-700"
  if (role === "PORTFOLIO_MANAGER") return "bg-blue-100 text-blue-700"
  return "bg-green-100 text-green-700"
}

function roleLabel(role: string) {
  if (role === "ADMIN") return "Admin"
  if (role === "PORTFOLIO_MANAGER") return "Portfolio Manager"
  return "Hiring Manager"
}

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  // Poll unread count every 30s
  const { data: unreadData } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: () => notificationsApi.list(true).then((r) => r.data),
    refetchInterval: 30_000,
  })

  const { data: allNotifs } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list(false).then((r) => r.data),
  })

  const markRead = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] })
      qc.invalidateQueries({ queryKey: ["notifications-unread"] })
    },
  })

  const markAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      toast.success("All notifications marked as read")
      qc.invalidateQueries({ queryKey: ["notifications"] })
      qc.invalidateQueries({ queryKey: ["notifications-unread"] })
    },
  })

  const dismiss = useMutation({
    mutationFn: notificationsApi.dismiss,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] })
      qc.invalidateQueries({ queryKey: ["notifications-unread"] })
    },
  })

  const dismissAllRead = useMutation({
    mutationFn: notificationsApi.dismissAllRead,
    onSuccess: () => {
      toast.success("Read notifications cleared")
      qc.invalidateQueries({ queryKey: ["notifications"] })
      qc.invalidateQueries({ queryKey: ["notifications-unread"] })
    },
  })

  const unreadCount = unreadData?.length ?? 0

  const handleLogout = async () => {
    await logout()
    navigate("/login", { replace: true })
  }

  return (
    <header className="h-16 border-b bg-card flex items-center justify-end gap-3 px-6">
      {/* Notification Bell */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          {/* Header row */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="font-semibold text-sm">Notifications</span>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => markAll.mutate()}
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </Button>
              )}
              {(allNotifs?.some((n: NotificationResponse) => n.is_read)) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive"
                  onClick={() => dismissAllRead.mutate()}
                  title="Delete all read notifications"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear read
                </Button>
              )}
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {!allNotifs?.length && (
              <p className="text-center text-sm text-muted-foreground py-8">
                No notifications
              </p>
            )}
            {allNotifs?.map((n: NotificationResponse) => (
              <div
                key={n.id}
                className={`group flex items-start gap-2 px-3 py-3 border-b last:border-0 transition-colors ${
                  !n.is_read ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-accent"
                }`}
              >
                {/* Dot indicator for unread */}
                <div className="mt-1.5 shrink-0">
                  {!n.is_read
                    ? <div className="h-2 w-2 rounded-full bg-blue-500" />
                    : <div className="h-2 w-2 rounded-full bg-transparent" />
                  }
                </div>

                {/* Message + timestamp — clicking marks as read */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => !n.is_read && markRead.mutate(n.id)}
                >
                  <p className="text-sm leading-snug">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(n.created_at).toLocaleDateString(undefined, {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Dismiss × button — always visible on hover */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  title="Dismiss notification"
                  onClick={(e) => { e.stopPropagation(); dismiss.mutate(n.id) }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2">
            <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium hidden sm:block">{user?.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>
            <div>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleBadgeColor(user?.role ?? "")}`}
              >
                {roleLabel(user?.role ?? "")}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/profile")}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

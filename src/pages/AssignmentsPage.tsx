import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

import { interviewsApi } from "@/services/api"
import { useAuth } from "@/context/AuthContext"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { AssignmentResponse } from "@/types"

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
}

export default function AssignmentsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ["assignments"],
    queryFn: () => interviewsApi.list().then((r) => r.data),
  })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        {user?.role === "HIRING_MANAGER" ? "My Assignments" : "Interview Assignments"}
      </h1>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Emp ID</TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead>Pay Band</TableHead>
                <TableHead>Interviewer</TableHead>
                <TableHead>Assigned Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(assignments as AssignmentResponse[]).map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {a.candidate_employee_id ?? "—"}
                  </TableCell>
                  <TableCell className="font-medium">{a.candidate_name ?? a.candidate_id}</TableCell>
                  <TableCell className="text-sm">{a.candidate_pay_band ?? "—"}</TableCell>
                  <TableCell>
                    {a.is_self_assigned
                      ? <span className="flex items-center gap-1.5">{a.hiring_manager_name}<Badge className="bg-blue-100 text-blue-700 text-xs">Self</Badge></span>
                      : (a.hiring_manager_name ?? a.hiring_manager_id)
                    }
                  </TableCell>
                  <TableCell>{new Date(a.assigned_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[a.status] ?? "bg-gray-100 text-gray-700"}>
                      {a.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/candidates/${a.candidate_id}`)}
                      >
                        View
                      </Button>
                      {/* HM can edit candidate fields (except Emp ID) */}
                      {user?.role === "HIRING_MANAGER" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/candidates/${a.candidate_id}?edit=1`)}
                        >
                          Edit
                        </Button>
                      )}
                      {a.status === "COMPLETED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/feedback/${a.id}`)}
                        >
                          View Feedback
                        </Button>
                      )}
                      {(user?.role === "HIRING_MANAGER" || (user?.role === "PORTFOLIO_MANAGER" && (a.is_self_assigned || a.hiring_manager_id === user?.id))) && a.status === "PENDING" && (
                        <Button
                          size="sm"
                          onClick={() => navigate(`/feedback/${a.id}`)}
                        >
                          Submit Feedback
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {assignments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No assignments found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

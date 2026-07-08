import { useState } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowLeft, UserCheck, Pencil } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { candidatesApi, interviewsApi } from "@/services/api"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { CandidateDetail } from "@/types"

const statusColors: Record<string, string> = {
  NEW: "bg-gray-100 text-gray-700", ASSIGNED: "bg-blue-100 text-blue-700",
  FEEDBACK_SUBMITTED: "bg-yellow-100 text-yellow-800", UNDER_REVIEW: "bg-orange-100 text-orange-700",
  APPROVED: "bg-green-100 text-green-700", REJECTED: "bg-red-100 text-red-700", ON_HOLD: "bg-amber-100 text-amber-700",
}

// Edit schema — employee_id excluded (read-only)
const editSchema = z.object({
  candidate_name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  position: z.string().min(1, "Position is required"),
  experience: z.string().optional(),
  current_location: z.string().optional(),
  pay_band_level: z.string().optional(),
  resume_url: z.string().optional(),
})
type EditValues = z.infer<typeof editSchema>

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [, setDecisionPending] = useState<"APPROVED" | "REJECTED" | "ON_HOLD" | null>(null)

  // Edit dialog open state — also opened if ?edit=1 is in the URL
  const [editOpen, setEditOpen] = useState(searchParams.get("edit") === "1")

  const { data, isLoading } = useQuery({
    queryKey: ["candidate", id],
    queryFn: () => candidatesApi.get(id!).then((r) => r.data as CandidateDetail),
    enabled: !!id,
  })

  const decisionMutation = useMutation({
    mutationFn: (decision: "APPROVED" | "REJECTED" | "ON_HOLD") =>
      candidatesApi.decision(id!, decision),
    onSuccess: () => {
      toast.success("Decision recorded")
      qc.invalidateQueries({ queryKey: ["candidate", id] })
      qc.invalidateQueries({ queryKey: ["candidates"] })
      setDecisionPending(null)
    },
    onError: () => toast.error("Failed to record decision"),
  })

  const selfAssignMutation = useMutation({
    mutationFn: () => interviewsApi.selfAssign(id!),
    onSuccess: () => {
      toast.success("You have self-assigned this interview")
      qc.invalidateQueries({ queryKey: ["candidate", id] })
      qc.invalidateQueries({ queryKey: ["candidates"] })
      qc.invalidateQueries({ queryKey: ["assignments"] })
    },
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      toast.error(e?.response?.data?.detail ?? "Failed to self-assign"),
  })

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading...</div>
  if (!data) return <div className="p-6 text-muted-foreground">Candidate not found</div>

  const { candidate, assignments, feedback } = data
  const canDecide =
    user?.role === "PORTFOLIO_MANAGER" &&
    !["NEW"].includes(candidate.status)
  const canSelfAssign =
    user?.role === "PORTFOLIO_MANAGER" && candidate.status === "NEW"
  const canEdit =
    user?.role === "PORTFOLIO_MANAGER" || user?.role === "HIRING_MANAGER"

  function openEdit() {
    setEditOpen(true)
    setSearchParams({ edit: "1" })
  }
  function closeEdit() {
    setEditOpen(false)
    setSearchParams({})
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{candidate.candidate_name}</h1>
          <p className="text-muted-foreground">{candidate.position}</p>
        </div>
        <Badge className={statusColors[candidate.status] ?? "bg-gray-100 text-gray-700"}>
          {candidate.status.replace(/_/g, " ")}
        </Badge>
        {canEdit && (
          <Button variant="outline" size="sm" className="gap-2" onClick={openEdit}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
        )}
      </div>

      {/* Self-assign action card */}
      {canSelfAssign && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Conduct this interview yourself</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Self-assign to skip the Hiring Manager step and interview the candidate directly.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 gap-2 border-blue-400 text-blue-700 hover:bg-blue-100"
              onClick={() => selfAssignMutation.mutate()}
              disabled={selfAssignMutation.isPending}
            >
              <UserCheck className="h-4 w-4" />
              {selfAssignMutation.isPending ? "Assigning..." : "Self-Assign Interview"}
            </Button>
          </CardContent>
        </Card>
      )}

      {canDecide && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <p className="text-sm font-medium mb-3">Make your hiring decision:</p>
            <div className="flex gap-2">
              {(["APPROVED", "REJECTED", "ON_HOLD"] as const).map((d) => (
                <AlertDialog key={d}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant={d === "APPROVED" ? "default" : d === "REJECTED" ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => setDecisionPending(d)}
                    >
                      {d.replace(/_/g, " ")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Decision</AlertDialogTitle>
                      <AlertDialogDescription>
                        Mark {candidate.candidate_name} as <strong>{d.replace(/_/g, " ")}</strong>?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => decisionMutation.mutate(d)}>Confirm</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="assignments">Assignments ({assignments.length})</TabsTrigger>
          <TabsTrigger value="feedback">Feedback ({feedback.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardContent className="pt-6 grid grid-cols-2 gap-4">
              <div className="col-span-2 flex items-center gap-2 pb-1 border-b">
                <p className="text-xs text-muted-foreground">Employee ID</p>
                <p className="font-mono font-semibold text-sm">{candidate.employee_id}</p>
                <Badge variant="outline" className="text-xs ml-1">Read-only</Badge>
              </div>
              <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{candidate.email}</p></div>
              <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium">{candidate.phone ?? "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Current Location</p><p className="font-medium">{candidate.current_location ?? "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Pay Band / Level</p><p className="font-medium">{candidate.pay_band_level ?? "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Experience</p><p className="font-medium">{candidate.experience ?? "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Resume</p>
                {candidate.resume_url
                  ? <a href={candidate.resume_url} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">View Resume</a>
                  : <p className="font-medium">—</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <div className="space-y-2">
            {assignments.length === 0 && <p className="text-muted-foreground text-sm">No assignments yet</p>}
            {assignments.map((a) => (
              <Card key={a.id}>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Assigned: {new Date(a.assigned_date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge>{a.status}</Badge>
                    {a.status === "COMPLETED" && (
                      <Button size="sm" variant="outline" onClick={() => navigate(`/feedback/${a.id}`)}>
                        View Feedback
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="feedback">
          <div className="space-y-2">
            {feedback.length === 0 && <p className="text-muted-foreground text-sm">No feedback yet</p>}
            {feedback.map((fb) => (
              <Card key={fb.id}>
                <CardHeader><CardTitle className="text-sm">Rating: {fb.rating}/5 · {fb.recommendation.replace(/_/g, " ")}</CardTitle></CardHeader>
                <CardContent>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/feedback/${fb.assignment_id}`)}>
                    View Full Feedback
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Edit Candidate Dialog ─────────────────────────────────────────── */}
      {editOpen && data && (
        <EditCandidateDialog
          candidateId={id!}
          defaultValues={{
            candidate_name: candidate.candidate_name,
            email: candidate.email,
            phone: candidate.phone ?? "",
            position: candidate.position,
            experience: candidate.experience ?? "",
            current_location: candidate.current_location ?? "",
            pay_band_level: candidate.pay_band_level ?? "",
            resume_url: candidate.resume_url ?? "",
          }}
          employeeId={candidate.employee_id}
          onClose={closeEdit}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["candidate", id] })
            qc.invalidateQueries({ queryKey: ["candidates"] })
            closeEdit()
          }}
        />
      )}
    </div>
  )
}

// ── Edit dialog component ──────────────────────────────────────────────────────
function EditCandidateDialog({
  candidateId,
  defaultValues,
  employeeId,
  onClose,
  onSaved,
}: {
  candidateId: string
  defaultValues: EditValues
  employeeId: string
  onClose: () => void
  onSaved: () => void
}) {
  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues,
  })

  const mutation = useMutation({
    mutationFn: (data: EditValues) => candidatesApi.update(candidateId, data),
    onSuccess: () => { toast.success("Candidate updated"); onSaved() },
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      toast.error(e?.response?.data?.detail ?? "Failed to update candidate"),
  })

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Candidate</DialogTitle>
        </DialogHeader>

        {/* Employee ID — always locked */}
        <div className="flex items-center gap-3 rounded-lg bg-slate-50 border px-3 py-2 mb-1">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Employee ID (cannot be changed)</p>
            <p className="font-mono font-semibold text-sm">{employeeId}</p>
          </div>
          <Badge variant="outline" className="text-xs shrink-0">Locked</Badge>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="candidate_name" render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="position" render={({ field }) => (
                <FormItem><FormLabel>Position</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="current_location" render={({ field }) => (
                <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="City, Country" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="pay_band_level" render={({ field }) => (
                <FormItem><FormLabel>Pay Band / Level</FormLabel><FormControl><Input placeholder="e.g. L4" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="experience" render={({ field }) => (
              <FormItem><FormLabel>Experience</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="resume_url" render={({ field }) => (
              <FormItem><FormLabel>Resume URL</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

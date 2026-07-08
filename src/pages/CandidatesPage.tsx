import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Plus, Eye, Pencil, UserPlus, Upload,
  ArrowUpDown, ArrowUp, ArrowDown, Search, X,
} from "lucide-react"

import { BulkUploadDialog } from "@/components/candidate/BulkUploadDialog"
import { candidatesApi, usersApi, interviewsApi } from "@/services/api"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import type { CandidateResponse, UserResponse } from "@/types"

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-gray-100 text-gray-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  INTERVIEW_SCHEDULED: "bg-purple-100 text-purple-700",
  INTERVIEW_COMPLETED: "bg-indigo-100 text-indigo-700",
  FEEDBACK_SUBMITTED: "bg-yellow-100 text-yellow-800",
  UNDER_REVIEW: "bg-orange-100 text-orange-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  ON_HOLD: "bg-amber-100 text-amber-700",
}

const ALL_STATUSES = [
  "NEW", "ASSIGNED", "INTERVIEW_SCHEDULED", "INTERVIEW_COMPLETED",
  "FEEDBACK_SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "ON_HOLD",
]

// ── Sort helpers ──────────────────────────────────────────────────────────────
type SortKey = "employee_id" | "candidate_name" | "email" | "pay_band_level" | "status"
type SortDir = "asc" | "desc" | null

function SortIcon({ active, dir }: { col: string; active: boolean; dir: SortDir }) {
  if (!active || dir === null) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40 inline" />
  return dir === "asc"
    ? <ArrowUp className="ml-1 h-3 w-3 inline" />
    : <ArrowDown className="ml-1 h-3 w-3 inline" />
}

// ── Create form schema ────────────────────────────────────────────────────────
const createSchema = z.object({
  employee_id: z.string().min(1, "Employee ID is required"),
  candidate_name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  position: z.string().min(1, "Position is required"),
  experience: z.string().optional(),
  current_location: z.string().optional(),
  pay_band_level: z.string().optional(),
  resume_url: z.string().optional(),
})
type CreateFormValues = z.infer<typeof createSchema>

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CandidatesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [assignCandidate, setAssignCandidate] = useState<CandidateResponse | null>(null)
  const [selectedHm, setSelectedHm] = useState("")

  // Filter state — one search box per column (empty = no filter)
  const [filters, setFilters] = useState<Partial<Record<SortKey, string>>>({})
  const [statusFilter, setStatusFilter] = useState("ALL")

  // Sort state
  const [sortKey, setSortKey] = useState<SortKey>("employee_id")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: rawCandidates = [], isLoading } = useQuery({
    queryKey: ["candidates"],
    queryFn: () => candidatesApi.list().then((r) => r.data as CandidateResponse[]),
  })

  const { data: assignableUsers = [] } = useQuery({
    queryKey: ["assignable-users"],
    queryFn: () => usersApi.listAssignableUsers().then((r) => r.data),
    enabled: user?.role === "PORTFOLIO_MANAGER" || user?.role === "ADMIN",
  })

  // ── Derived: filter + sort ─────────────────────────────────────────────────
  const candidates = useMemo(() => {
    let rows = [...rawCandidates]

    // Column text filters
    const fEmpId = filters.employee_id?.toLowerCase()
    const fName  = filters.candidate_name?.toLowerCase()
    const fEmail = filters.email?.toLowerCase()
    const fPay   = filters.pay_band_level?.toLowerCase()

    if (fEmpId) rows = rows.filter(c => c.employee_id.toLowerCase().includes(fEmpId))
    if (fName)  rows = rows.filter(c => c.candidate_name.toLowerCase().includes(fName))
    if (fEmail) rows = rows.filter(c => c.email.toLowerCase().includes(fEmail))
    if (fPay)   rows = rows.filter(c => (c.pay_band_level ?? "").toLowerCase().includes(fPay))

    // Status dropdown filter
    if (statusFilter && statusFilter !== "ALL") {
      rows = rows.filter(c => c.status === statusFilter)
    }

    // Sort
    if (sortKey && sortDir) {
      rows.sort((a, b) => {
        const av = (a[sortKey] ?? "").toString().toLowerCase()
        const bv = (b[sortKey] ?? "").toString().toLowerCase()
        const cmp = av.localeCompare(bv)
        return sortDir === "asc" ? cmp : -cmp
      })
    }

    return rows
  }, [rawCandidates, filters, statusFilter, sortKey, sortDir])

  // ── Sort toggle ───────────────────────────────────────────────────────────
  function toggleSort(key: SortKey) {
    if (sortKey !== key) { setSortKey(key); setSortDir("asc"); return }
    setSortDir(d => d === "asc" ? "desc" : d === "desc" ? null : "asc")
  }

  function setFilter(key: SortKey, val: string) {
    setFilters(f => ({ ...f, [key]: val || undefined }))
  }

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      employee_id: "", candidate_name: "", email: "", phone: "", position: "",
      experience: "", current_location: "", pay_band_level: "", resume_url: "",
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateFormValues) => candidatesApi.create(data),
    onSuccess: () => {
      toast.success("Candidate created")
      qc.invalidateQueries({ queryKey: ["candidates"] })
      setCreateOpen(false)
      createForm.reset()
    },
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      toast.error(e?.response?.data?.detail ?? "Failed to create candidate"),
  })

  const assignMutation = useMutation({
    mutationFn: ({ candidate_id, hiring_manager_id }: { candidate_id: string; hiring_manager_id: string }) =>
      interviewsApi.assign(candidate_id, hiring_manager_id),
    onSuccess: () => {
      toast.success("Interview assigned and hiring manager notified")
      qc.invalidateQueries({ queryKey: ["candidates"] })
      setAssignCandidate(null)
    },
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      toast.error(e?.response?.data?.detail ?? "Failed to assign interview"),
  })

  const hmOptions = (assignableUsers as UserResponse[]).filter(u => u.is_active)

  const hasFilters = Object.values(filters).some(Boolean) || statusFilter !== "ALL"

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Candidates</h1>
        {user?.role === "PORTFOLIO_MANAGER" && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBulkOpen(true)} className="gap-2">
              <Upload className="h-4 w-4" /> Bulk Import
            </Button>
            <Button onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Add Candidate
            </Button>
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Employee ID filter */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Emp ID"
            value={filters.employee_id ?? ""}
            onChange={e => setFilter("employee_id", e.target.value)}
            className="pl-8 h-8 w-32 text-xs"
          />
        </div>
        {/* Name filter */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Name"
            value={filters.candidate_name ?? ""}
            onChange={e => setFilter("candidate_name", e.target.value)}
            className="pl-8 h-8 w-36 text-xs"
          />
        </div>
        {/* Email filter */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Email"
            value={filters.email ?? ""}
            onChange={e => setFilter("email", e.target.value)}
            className="pl-8 h-8 w-44 text-xs"
          />
        </div>
        {/* Pay band filter */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Pay Band"
            value={filters.pay_band_level ?? ""}
            onChange={e => setFilter("pay_band_level", e.target.value)}
            className="pl-8 h-8 w-28 text-xs"
          />
        </div>
        {/* Status dropdown filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {ALL_STATUSES.map(s => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Clear filters */}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs text-muted-foreground"
            onClick={() => { setFilters({}); setStatusFilter("ALL") }}
          >
            <X className="h-3 w-3" /> Clear
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {candidates.length} of {rawCandidates.length} candidates
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {/* Sortable column headers */}
                {(
                  [
                    { key: "employee_id",    label: "Emp ID" },
                    { key: "candidate_name", label: "Name" },
                    { key: "email",          label: "Email" },
                    { key: "pay_band_level", label: "Pay Band" },
                    { key: "status",         label: "Status" },
                  ] as { key: SortKey; label: string }[]
                ).map(({ key, label }) => (
                  <TableHead
                    key={key}
                    className="cursor-pointer select-none whitespace-nowrap"
                    onClick={() => toggleSort(key)}
                  >
                    {label}
                    <SortIcon col={key} active={sortKey === key} dir={sortKey === key ? sortDir : null} />
                  </TableHead>
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {candidates.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{c.employee_id}</TableCell>
                  <TableCell className="font-medium">{c.candidate_name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{c.email}</TableCell>
                  <TableCell className="text-sm">{c.pay_band_level ?? "—"}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[c.status] ?? "bg-gray-100 text-gray-700"}>
                      {c.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost" size="icon"
                        title="View details"
                        onClick={() => navigate(`/candidates/${c.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {user?.role === "PORTFOLIO_MANAGER" && c.status === "NEW" && (
                        <Button
                          variant="ghost" size="icon"
                          title="Assign to Hiring Manager"
                          onClick={() => { setAssignCandidate(c); setSelectedHm("") }}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      )}
                      {user?.role === "PORTFOLIO_MANAGER" && (
                        <Button
                          variant="ghost" size="icon"
                          title="Edit candidate"
                          onClick={() => navigate(`/candidates/${c.id}`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {candidates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    {hasFilters ? "No candidates match the current filters." : "No candidates found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Create Candidate Modal ─────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) createForm.reset() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add New Candidate</DialogTitle></DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))} className="space-y-3">
              <FormField control={createForm.control} name="employee_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee ID <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input placeholder="e.g. EMP001" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={createForm.control} name="candidate_name" render={({ field }) => (
                  <FormItem><FormLabel>Full Name <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={createForm.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email <span className="text-destructive">*</span></FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={createForm.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={createForm.control} name="position" render={({ field }) => (
                  <FormItem><FormLabel>Position <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={createForm.control} name="current_location" render={({ field }) => (
                  <FormItem><FormLabel>Current Location</FormLabel><FormControl><Input placeholder="City, Country" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={createForm.control} name="pay_band_level" render={({ field }) => (
                  <FormItem><FormLabel>Pay Band / Level</FormLabel><FormControl><Input placeholder="e.g. L4, Band 6" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={createForm.control} name="experience" render={({ field }) => (
                <FormItem><FormLabel>Experience</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={createForm.control} name="resume_url" render={({ field }) => (
                <FormItem><FormLabel>Resume URL</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Candidate"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Assign Interview Modal ─────────────────────────────────────────── */}
      {assignCandidate && (
        <Dialog open onOpenChange={() => setAssignCandidate(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Interview — {assignCandidate.candidate_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">Select an interviewer for this candidate:</p>
              <Select onValueChange={setSelectedHm} value={selectedHm}>
                <SelectTrigger><SelectValue placeholder="Select interviewer" /></SelectTrigger>
                <SelectContent>
                  {hmOptions.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">No interviewers found</div>
                  )}
                  {hmOptions.map((hm) => (
                    <SelectItem key={hm.id} value={hm.id}>
                      <span className="flex items-center gap-2">
                        {hm.name}
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${hm.role === "PORTFOLIO_MANAGER" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                          {hm.role === "PORTFOLIO_MANAGER" ? "Portfolio Mgr" : "Hiring Mgr"}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignCandidate(null)}>Cancel</Button>
              <Button
                disabled={!selectedHm || assignMutation.isPending}
                onClick={() => assignMutation.mutate({ candidate_id: assignCandidate.id, hiring_manager_id: selectedHm })}
              >
                {assignMutation.isPending ? "Assigning..." : "Assign Interview"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Bulk Import Dialog ─────────────────────────────────────────────── */}
      <BulkUploadDialog open={bulkOpen} onClose={() => setBulkOpen(false)} />
    </div>
  )
}

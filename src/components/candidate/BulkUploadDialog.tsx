import { useRef, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, SkipForward, X } from "lucide-react"

import { candidatesApi } from "@/services/api"
import type { BulkUploadResult } from "@/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Props {
  open: boolean
  onClose: () => void
}

export function BulkUploadDialog({ open, onClose }: Props) {
  const qc = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<BulkUploadResult | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const uploadMutation = useMutation({
    mutationFn: (f: File) => candidatesApi.bulkUpload(f),
    onSuccess: (res) => {
      const r = res.data
      setResult(r)
      qc.invalidateQueries({ queryKey: ["candidates"] })
      if (r.summary.created > 0) {
        toast.success(`${r.summary.created} candidate${r.summary.created !== 1 ? "s" : ""} imported successfully`)
      }
      if (r.summary.errors > 0) {
        toast.warning(`${r.summary.errors} row${r.summary.errors !== 1 ? "s" : ""} had errors`)
      }
    },
    onError: (e: { response?: { data?: { detail?: string } } }) => {
      toast.error(e?.response?.data?.detail ?? "Upload failed")
    },
  })

  function handleFileSelect(selected: File | null) {
    if (!selected) return
    const ext = selected.name.split(".").pop()?.toLowerCase()
    if (ext !== "csv" && ext !== "xlsx") {
      toast.error("Please select a .csv or .xlsx file")
      return
    }
    setFile(selected)
    setResult(null)
  }

  function handleDownloadTemplate() {
    candidatesApi.downloadTemplate().then((res) => {
      const url = window.URL.createObjectURL(new Blob([res.data as BlobPart]))
      const a = document.createElement("a")
      a.href = url
      a.download = "candidates_template.csv"
      a.click()
      window.URL.revokeObjectURL(url)
    }).catch(() => toast.error("Failed to download template"))
  }

  function handleClose() {
    setFile(null)
    setResult(null)
    onClose()
  }

  const isUploading = uploadMutation.isPending

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Import Candidates
          </DialogTitle>
        </DialogHeader>

        {/* ── Step 1: file not yet uploaded ── */}
        {!result && (
          <div className="space-y-4">
            {/* Template download */}
            <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Download Template</p>
                <p className="text-xs text-muted-foreground">
                  CSV with columns: candidate_name, email, phone, position, experience, resume_url
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="gap-2 shrink-0">
                <Download className="h-4 w-4" />
                Template
              </Button>
            </div>

            {/* Drop zone */}
            <div
              className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 transition-colors cursor-pointer
                ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"}`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                handleFileSelect(e.dataTransfer.files[0] ?? null)
              }}
            >
              <Upload className="h-10 w-10 text-muted-foreground mb-3" />
              {file ? (
                <div className="text-center">
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(file.size / 1024).toFixed(1)} KB — click to change
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm font-medium">Drop your CSV or Excel file here</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                </div>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              <strong>Required columns:</strong> candidate_name, email, position &nbsp;·&nbsp;
              <strong>Optional:</strong> phone, experience, resume_url
            </p>
          </div>
        )}

        {/* ── Step 2: results ── */}
        {result && (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Total Rows", value: result.summary.total_rows, color: "bg-gray-100 text-gray-700" },
                { label: "Created", value: result.summary.created, color: "bg-green-100 text-green-700" },
                { label: "Skipped", value: result.summary.skipped, color: "bg-yellow-100 text-yellow-800" },
                { label: "Errors", value: result.summary.errors, color: "bg-red-100 text-red-700" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-lg border p-3 text-center">
                  <div className="text-2xl font-bold">{value}</div>
                  <Badge className={`mt-1 text-xs ${color}`}>{label}</Badge>
                </div>
              ))}
            </div>

            {/* Per-row detail tabs */}
            <Tabs defaultValue="created">
              <TabsList className="w-full">
                <TabsTrigger value="created" className="flex-1 gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" /> Created ({result.created.length})
                </TabsTrigger>
                <TabsTrigger value="skipped" className="flex-1 gap-1">
                  <SkipForward className="h-3 w-3 text-yellow-600" /> Skipped ({result.skipped.length})
                </TabsTrigger>
                <TabsTrigger value="errors" className="flex-1 gap-1">
                  <AlertCircle className="h-3 w-3 text-red-600" /> Errors ({result.errors.length})
                </TabsTrigger>
              </TabsList>

              {(["created", "skipped", "errors"] as const).map((tab) => (
                <TabsContent key={tab} value={tab}>
                  <div className="max-h-52 overflow-y-auto rounded-md border divide-y text-sm">
                    {result[tab].length === 0 && (
                      <p className="text-center text-muted-foreground py-6">None</p>
                    )}
                    {result[tab].map((r) => (
                      <div key={r.row} className="flex items-start justify-between px-3 py-2 gap-2">
                        <div>
                          <span className="text-xs text-muted-foreground mr-2">Row {r.row}</span>
                          <span className="font-medium">{r.candidate_name ?? r.email}</span>
                          {r.candidate_name && <span className="text-muted-foreground text-xs ml-1">· {r.email}</span>}
                        </div>
                        {r.reason && <span className="text-xs text-muted-foreground text-right shrink-0 max-w-[40%]">{r.reason}</span>}
                      </div>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}

        <DialogFooter className="gap-2">
          {!result ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isUploading}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button
                onClick={() => file && uploadMutation.mutate(file)}
                disabled={!file || isUploading}
                className="gap-2"
              >
                {isUploading
                  ? <><span className="animate-spin inline-block h-4 w-4 border-2 border-current border-t-transparent rounded-full" /> Importing...</>
                  : <><Upload className="h-4 w-4" /> Import Candidates</>}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => { setFile(null); setResult(null) }} className="gap-1">
                <Upload className="h-4 w-4" /> Upload Another File
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

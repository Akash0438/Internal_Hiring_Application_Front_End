import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { feedbackApi } from "@/services/api"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import type { FeedbackResponse } from "@/types"

const feedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  recommendation: z.enum(["STRONGLY_RECOMMEND", "RECOMMEND", "NEUTRAL", "DO_NOT_RECOMMEND"]),
  feedback: z.string().min(1, "Feedback is required"),
})

type FeedbackFormValues = z.infer<typeof feedbackSchema>

const recColors: Record<string, string> = {
  STRONGLY_RECOMMEND: "bg-green-100 text-green-700",
  RECOMMEND: "bg-blue-100 text-blue-700",
  NEUTRAL: "bg-gray-100 text-gray-700",
  DO_NOT_RECOMMEND: "bg-red-100 text-red-700",
}

export default function FeedbackPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const qc = useQueryClient()

  const { data: existingFeedback, isLoading } = useQuery({
    queryKey: ["feedback", assignmentId],
    queryFn: () => feedbackApi.get(assignmentId!).then((r) => r.data as FeedbackResponse),
    enabled: !!assignmentId,
    retry: false,
  })

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { rating: 3, recommendation: "NEUTRAL", feedback: "" },
  })

  const submitMutation = useMutation({
    mutationFn: (values: FeedbackFormValues) =>
      feedbackApi.submit({
        assignment_id: assignmentId!,
        rating: values.rating,
        feedback: values.feedback,
        recommendation: values.recommendation,
      }),
    onSuccess: () => {
      toast.success("Feedback submitted successfully")
      qc.invalidateQueries({ queryKey: ["feedback", assignmentId] })
      navigate("/assignments")
    },
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      toast.error(e?.response?.data?.detail ?? "Failed to submit feedback"),
  })

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading...</div>

  // ── Read-only view ─────────────────────────────────────────────────────────
  if (existingFeedback) {
    return (
      <div className="space-y-4 max-w-2xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Interview Feedback</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              Rating: {existingFeedback.rating}/5
              <Badge className={recColors[existingFeedback.recommendation]}>
                {existingFeedback.recommendation.replace(/_/g, " ")}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">FEEDBACK</p>
              <p className="text-sm whitespace-pre-wrap">{existingFeedback.feedback}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Submitted: {new Date(existingFeedback.submitted_at).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Submit form ────────────────────────────────────────────────────────────
  if (user?.role !== "HIRING_MANAGER" && user?.role !== "PORTFOLIO_MANAGER") {
    return <div className="p-6 text-muted-foreground">No feedback has been submitted yet.</div>
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Submit Interview Feedback</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => submitMutation.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="rating" render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating (1–5)</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} max={5} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="recommendation" render={({ field }) => (
                <FormItem>
                  <FormLabel>Recommendation</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="STRONGLY_RECOMMEND">Strongly Recommend</SelectItem>
                      <SelectItem value="RECOMMEND">Recommend</SelectItem>
                      <SelectItem value="NEUTRAL">Neutral</SelectItem>
                      <SelectItem value="DO_NOT_RECOMMEND">Do Not Recommend</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="feedback" render={({ field }) => (
                <FormItem>
                  <FormLabel>Feedback</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your overall assessment of the candidate..."
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
                {submitMutation.isPending ? "Submitting..." : "Submit Feedback"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

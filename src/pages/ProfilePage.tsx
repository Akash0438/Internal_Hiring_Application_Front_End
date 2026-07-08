import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { authApi } from "@/services/api"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  PORTFOLIO_MANAGER: "bg-blue-100 text-blue-700",
  HIRING_MANAGER: "bg-green-100 text-green-700",
}

const roleLabel: Record<string, string> = {
  ADMIN: "Admin", PORTFOLIO_MANAGER: "Portfolio Manager", HIRING_MANAGER: "Hiring Manager",
}

const pwSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "At least 8 characters"),
    confirm_password: z.string().min(1, "Please confirm"),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  })

type PwValues = z.infer<typeof pwSchema>

export default function ProfilePage() {
  const { user, setUser } = useAuth()
  const [showPwForm, setShowPwForm] = useState(false)

  const form = useForm<PwValues>({
    resolver: zodResolver(pwSchema),
    defaultValues: { current_password: "", new_password: "", confirm_password: "" },
  })

  const mutation = useMutation({
    mutationFn: (values: PwValues) =>
      authApi.changePassword(values.new_password, values.current_password),
    onSuccess: async () => {
      toast.success("Password changed successfully")
      form.reset()
      setShowPwForm(false)
      const res = await authApi.me()
      setUser(res.data)
    },
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      toast.error(e?.response?.data?.detail ?? "Failed to change password"),
  })

  if (!user) return null

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">My Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            {user.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{user.email}</p></div>
          <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium">{user.phone ?? "—"}</p></div>
          <div>
            <p className="text-xs text-muted-foreground">Role</p>
            <Badge className={roleColors[user.role]}>{roleLabel[user.role]}</Badge>
          </div>
          <div><p className="text-xs text-muted-foreground">Account Status</p>
            <Badge className="bg-green-100 text-green-700">Active</Badge>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Change Password</h2>
          <Button variant="outline" size="sm" onClick={() => setShowPwForm(!showPwForm)}>
            {showPwForm ? "Cancel" : "Change Password"}
          </Button>
        </div>

        {showPwForm && (
          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
                  <FormField control={form.control} name="current_password" render={({ field }) => (
                    <FormItem><FormLabel>Current Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="new_password" render={({ field }) => (
                    <FormItem><FormLabel>New Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="confirm_password" render={({ field }) => (
                    <FormItem><FormLabel>Confirm New Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving..." : "Update Password"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

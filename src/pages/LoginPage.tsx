"use client"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Users, ClipboardList, CheckCircle } from "lucide-react"

import { useAuth } from "@/context/AuthContext"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
})

type FormValues = z.infer<typeof schema>

const highlights = [
  { icon: Users, text: "Manage candidates end-to-end" },
  { icon: ClipboardList, text: "Assign & track interviews" },
  { icon: CheckCircle, text: "Make data-driven decisions" },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      const user = await login(values.email, values.password)
      if (user.must_change_password) {
        navigate("/change-password", { replace: true })
      } else {
        navigate("/dashboard", { replace: true })
      }
    } catch {
      toast.error("Invalid email or password. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-violet-700 text-white flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center font-bold text-sm">IP</div>
          <span className="font-bold text-lg">Interview Platform</span>
        </div>
        <div className="space-y-6">
          <h2 className="text-4xl font-extrabold leading-tight">
            Streamline your<br />entire hiring process.
          </h2>
          <p className="text-blue-100 text-base leading-relaxed max-w-sm">
            From candidate creation to final decision — everything in one secure, role-based platform.
          </p>
          <div className="space-y-3 pt-2">
            {highlights.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm text-blue-100">{text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-blue-300 text-xs">© {new Date().getFullYear()} Interview Management Platform</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 justify-center">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm">IP</div>
            <span className="font-bold text-slate-800">Interview Platform</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800">Welcome back</h1>
            <p className="text-slate-500 mt-1 text-sm">Sign in to your account to continue</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-7">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Email address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="email"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700">Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 border-0 font-semibold"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </Form>
          </div>

          <p className="text-center text-xs text-slate-400">
            Access is granted by your administrator. Contact your admin if you need an account.
          </p>
        </div>
      </div>
    </div>
  )
}

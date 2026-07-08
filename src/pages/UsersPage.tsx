import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, Pencil, RotateCcw, ToggleLeft } from "lucide-react"

import { usersApi } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import type { UserResponse } from "@/types"

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  role: z.enum(["PORTFOLIO_MANAGER", "HIRING_MANAGER", "ADMIN"]),
})

type CreateFormValues = z.infer<typeof createSchema>

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  PORTFOLIO_MANAGER: "bg-blue-100 text-blue-700",
  HIRING_MANAGER: "bg-green-100 text-green-700",
}

const roleLabel: Record<string, string> = {
  ADMIN: "Admin",
  PORTFOLIO_MANAGER: "Portfolio Manager",
  HIRING_MANAGER: "Hiring Manager",
}

export default function UsersPage() {
  const qc = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editUser, setEditUser] = useState<UserResponse | null>(null)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list().then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateFormValues) => usersApi.create(data),
    onSuccess: () => {
      toast.success("User created and welcome email sent")
      qc.invalidateQueries({ queryKey: ["users"] })
      setCreateOpen(false)
    },
    onError: (e: { response?: { data?: { detail?: string } } }) => {
      toast.error(e?.response?.data?.detail ?? "Failed to create user")
    },
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      usersApi.update(id, { is_active }),
    onSuccess: () => {
      toast.success("User status updated")
      qc.invalidateQueries({ queryKey: ["users"] })
    },
  })

  const resetPassword = useMutation({
    mutationFn: (id: string) => usersApi.resetPassword(id),
    onSuccess: () => toast.success("Password reset — new temporary password sent by email"),
    onError: () => toast.error("Failed to reset password"),
  })

  const toggleCanCreate = useMutation({
    mutationFn: ({ id, can }: { id: string; can: boolean }) =>
      usersApi.update(id, { can_create_portfolio_managers: can }),
    onSuccess: () => {
      toast.success("Permission updated")
      qc.invalidateQueries({ queryKey: ["users"] })
    },
  })

  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", email: "", phone: "", role: "HIRING_MANAGER" },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Create User
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(users as UserResponse[]).map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge className={roleColors[u.role]}>{roleLabel[u.role]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={u.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                      {u.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.role === "PORTFOLIO_MANAGER" && (
                      <Badge
                        className={`cursor-pointer ${u.can_create_portfolio_managers ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}
                        onClick={() => toggleCanCreate.mutate({ id: u.id, can: !u.can_create_portfolio_managers })}
                      >
                        Can create Portfolio Mgrs: {u.can_create_portfolio_managers ? "Yes" : "No"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditUser(u)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => resetPassword.mutate(u.id)}
                        title="Reset password"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleActive.mutate({ id: u.id, is_active: !u.is_active })}
                        title={u.is_active ? "Deactivate" : "Activate"}
                      >
                        <ToggleLeft className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create User Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              <FormField control={createForm.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={createForm.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={createForm.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone (optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={createForm.control} name="role" render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="HIRING_MANAGER">Hiring Manager</SelectItem>
                      <SelectItem value="PORTFOLIO_MANAGER">Portfolio Manager</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["users"] }); setEditUser(null) }}
        />
      )}
    </div>
  )
}

function EditUserModal({ user, onClose, onSaved }: { user: UserResponse; onClose: () => void; onSaved: () => void }) {
  const editSchema = z.object({
    name: z.string().min(1),
    phone: z.string().optional(),
  })
  type EditValues = z.infer<typeof editSchema>
  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: user.name, phone: user.phone ?? "" },
  })

  const mutation = useMutation({
    mutationFn: (data: EditValues) => usersApi.update(user.id, data),
    onSuccess: () => { toast.success("User updated"); onSaved() },
    onError: () => toast.error("Failed to update user"),
  })

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit User — {user.name}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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

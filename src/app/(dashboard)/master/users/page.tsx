"use client"

import React, { useState } from "react"
import { useForm, Controller, SubmitHandler } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { toast } from "sonner"

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

// -----------------------------------------------------------------------------
// Schema for user create / edit
// -----------------------------------------------------------------------------
const userSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "SUPER_ADMIN", "MANAGER", "OPERATOR", "AUDITOR", "VIEWER"]),
  yardId: z.string().optional(),
  isActive: z.boolean().default(true),
})

type UserForm = z.infer<typeof userSchema>

// -----------------------------------------------------------------------------
// Types returned by the API
// -----------------------------------------------------------------------------
interface Yard {
  id: string
  name: string
}

interface User {
  id: string
  username: string
  email: string
  role: string
  yard: Yard | null
  isActive: boolean
  lastLogin: string | null
}

export default function UsersPage() {
  const queryClient = useQueryClient()
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users")
      if (!res.ok) throw new Error("Failed to fetch users")
      return res.json()
    },
  })

  const createMut = useMutation({
    mutationFn: async (payload: UserForm) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to create user")
      return res.json()
    },
    onSuccess: () => {
      toast.success("User created")
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
    onError: (err: any) => toast.error(err.message),
  })

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UserForm }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update user")
      return res.json()
    },
    onSuccess: () => {
      toast.success("User updated")
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
    onError: (err: any) => toast.error(err.message),
  })

  const toggleActiveMut = useMutation({
    mutationFn: async ({ id, activate }: { id: string; activate: boolean }) => {
      const res = await fetch(`/api/users/${id}?activate=${activate}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to change status")
      return res.json()
    },
    onSuccess: () => {
      toast.success("User status changed")
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
    onError: (err: any) => toast.error(err.message),
  })

  // ---------------------------------------------------------------------------
  // Dialog handling
  // ---------------------------------------------------------------------------
  const [open, setOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const defaultValues: UserForm = {
    username: "",
    email: "",
    password: undefined,
    role: "OPERATOR",
    yardId: "",
    isActive: true,
  }
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
  } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues,
  })

  const onSubmit: SubmitHandler<UserForm> = (data) => {
    if (editUser) {
      updateMut.mutate({ id: editUser.id, data })
    } else {
      createMut.mutate(data)
    }
    setOpen(false)
    reset(defaultValues)
    setEditUser(null)
  }

  const startEdit = (user: User) => {
    setEditUser(user)
    setValue("username", user.username)
    setValue("email", user.email)
    setValue("role", user.role as any)
    setValue("yardId", user.yard?.id ?? "")
    setValue("isActive", user.isActive)
    setOpen(true)
  }

  // ---------------------------------------------------------------------------
  // Row animation
  // ---------------------------------------------------------------------------
  const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  }

  // ---------------------------------------------------------------------------
  // Simple role guard – assume session is fetched elsewhere; if not admin, show message.
  // ---------------------------------------------------------------------------
  // For brevity we only check client‑side – server side should also enforce.
  const [sessionRole, setSessionRole] = useState<string>("ADMIN") // placeholder, replace with real session fetch.

  if (!["ADMIN", "SUPER_ADMIN"].includes(sessionRole)) {
    return <div className="p-4">Forbidden – you do not have permission to view this page.</div>
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">User Management</h1>
      <Button onClick={() => setOpen(true)}>Add User</Button>

      {/* Users table */}
      {isLoading ? (
        <div>Loading…</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Yard</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((u) => (
              <motion.tr
                key={u.id}
                variants={rowVariants}
                initial="hidden"
                animate="visible"
                className="border-t"
              >
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>{u.yard?.name ?? "-"}</TableCell>
                <TableCell>{u.isActive ? "Yes" : "No"}</TableCell>
                <TableCell>{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "-"}</TableCell>
                <TableCell className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => startEdit(u)}>
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      toggleActiveMut.mutate({ id: u.id, activate: !u.isActive })
                    }
                  >
                    {u.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={(v) => {
        setOpen(v)
        if (!v) { setEditUser(null); reset(defaultValues) }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editUser ? "Edit User" : "Add User"}</DialogTitle>
            <DialogDescription>{editUser ? "Update existing user" : "Create a new user"}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input placeholder="Username" {...register("username")} />
            <Input placeholder="Email" type="email" {...register("email")} />
            {/* Password is optional on edit */}
            <Input placeholder="Password" type="password" {...register("password")} />
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {["ADMIN", "SUPER_ADMIN", "MANAGER", "OPERATOR", "AUDITOR", "VIEWER"].map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <Input placeholder="Yard ID" {...register("yardId")} />
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <Select onValueChange={(v) => field.onChange(v === "true")} defaultValue={String(field.value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Active?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <DialogFooter>
              <Button type="submit">{editUser ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

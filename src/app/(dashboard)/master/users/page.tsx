// src/app/(dashboard)/master/users/page.tsx
"use client"

import React, { useState } from "react"
import { useForm, SubmitHandler } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { toast } from "sonner"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
const createSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "OPERATOR", "ACCOUNTS", "VIEW_ONLY"]),
  yardId: z.string().optional(),
  isActive: z.boolean().default(true),
})

const editSchema = createSchema.omit({ password: true })

type CreateForm = z.infer<typeof createSchema>
type EditForm = z.infer<typeof editSchema>

// ---------------------------------------------------------------------------
// Types returned by the API
// ---------------------------------------------------------------------------
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
  // ---------------------------------------------------------------------
  // Session role – placeholder, replace with real session fetch when available
  // ---------------------------------------------------------------------
  const [sessionRole] = useState<string>("ADMIN") // TODO: replace with auth hook

  const canView = ["ADMIN", "SUPER_ADMIN"].includes(sessionRole)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const queryClient = useQueryClient()

  // ---------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users")
      if (!res.ok) throw new Error("Failed to fetch users")
      return res.json()
    },
  })

  const { data: yards } = useQuery<Yard[]>({
    queryKey: ["yards"],
    queryFn: async () => {
      const res = await fetch("/api/master/yards")
      if (!res.ok) return []
      return res.json()
    },
    enabled: !!dialogOpen, // fetch yards only when dialog may need them
  })

  // ---------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------
  const createMut = useMutation({
    mutationFn: async (payload: CreateForm) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Create failed")
      return res.json()
    },
    onSuccess: () => {
      toast.success("User created")
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
    onError: (err: any) => toast.error(err.message),
  })

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EditForm }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Update failed")
      return res.json()
    },
    onSuccess: () => {
      toast.success("User updated")
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
    onError: (err: any) => toast.error(err.message),
  })

  const deactivateMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Deactivate failed")
      return res.json()
    },
    onSuccess: () => {
      toast.success("User deactivated")
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
    onError: (err: any) => toast.error(err.message),
  })

  // ---------------------------------------------------------------------
  // Form handling
  // ---------------------------------------------------------------------
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      role: "OPERATOR",
      yardId: "",
      isActive: true,
    },
  })

  const {
    register: editRegister,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    setValue: setEditValue,
    control: editControl,
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      username: "",
      email: "",
      role: "OPERATOR",
      yardId: "",
      isActive: true,
    },
  })

  const onCreate: SubmitHandler<CreateForm> = (data) => {
    createMut.mutate(data)
    setDialogOpen(false)
    reset()
  }

  const onEdit: SubmitHandler<EditForm> = (data) => {
    if (editUser) {
      updateMut.mutate({ id: editUser.id, data })
    }
    setDialogOpen(false)
    resetEdit()
    setEditUser(null)
  }

  const startEdit = (user: User) => {
    setEditUser(user)
    setEditValue("username", user.username)
    setEditValue("email", user.email)
    setEditValue("role", user.role as any)
    setEditValue("yardId", user.yard?.id ?? "")
    setEditValue("isActive", user.isActive)
    setDialogOpen(true)
  }

  // ---------------------------------------------------------------------
  // Row animation
  // ---------------------------------------------------------------------
  const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  }

  if (!canView) {
    return <div className="p-4">Forbidden – you do not have permission to view this page.</div>
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-4 space-y-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={() => { setEditUser(null); setDialogOpen(true); }} className="mb-4">
          Add User
        </Button>

        {usersLoading ? (
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
                  <TableCell className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => startEdit(u)}>
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          {u.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{u.isActive ? "Deactivate" : "Activate"} User</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to {u.isActive ? "deactivate" : "activate"} "{u.username}"?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deactivateMut.mutate(u.id)}>
                            {u.isActive ? "Deactivate" : "Activate"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Add / Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editUser ? "Edit User" : "Add User"}</DialogTitle>
              <DialogDescription>
                {editUser ? "Update existing user" : "Create a new user"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={editUser ? handleEditSubmit(onEdit) : handleSubmit(onCreate)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <Input {...(editUser ? editRegister("username") : register("username"))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input type="email" {...(editUser ? editRegister("email") : register("email"))} />
              </div>
              {!editUser && (
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <Input type="password" {...register("password")} />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <Select onValueChange={(v) => (editUser ? setEditValue("role", v as any) : setValue("role", v as any))} defaultValue={editUser?.role ?? "OPERATOR"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {["SUPER_ADMIN", "ADMIN", "OPERATOR", "ACCOUNTS", "VIEW_ONLY"].map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Yard</label>
                <Select onValueChange={(v) => (editUser ? setEditValue("yardId", v) : setValue("yardId", v))} defaultValue={editUser?.yard?.id ?? ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select yard" />
                  </SelectTrigger>
                  <SelectContent>
                    {yards?.map((y) => (
                      <SelectItem key={y.id} value={y.id}>
                        {y.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Active</label>
                <Switch {...(editUser ? editRegister("isActive") : register("isActive"))} />
              </div>
              <DialogFooter>
                <Button type="submit">{editUser ? "Update" : "Create"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  )
}

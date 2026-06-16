// src/app/(dashboard)/master/setup/page.tsx
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
import { Switch } from "@/components/ui/switch"

// ---------------------------------------------------------------------------
// Schema for add / edit
// ---------------------------------------------------------------------------
const itemSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  isActive: z.boolean().default(true),
})

type ItemForm = z.infer<typeof itemSchema>

interface MasterItem {
  id: string
  name: string
  code: string
  isActive: boolean
}

const masterTypes = ["yards", "lines", "terminals", "ports", "transporters"] as const
type MasterType = typeof masterTypes[number]

export default function MasterSetupPage() {
  const [activeTab, setActiveTab] = useState<MasterType>(masterTypes[0])
  const [editItem, setEditItem] = useState<MasterItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  // -----------------------------------------------------------------------
  // Data fetching per type – shared query using the active tab as key
  // -----------------------------------------------------------------------
  const { data: items, isLoading } = useQuery<MasterItem[]>({
    queryKey: ["master", activeTab],
    queryFn: async () => {
      const res = await fetch(`/api/master/${activeTab}`)
      if (!res.ok) throw new Error(`Failed to fetch ${activeTab}`)
      return res.json()
    },
    keepPreviousData: true,
  })

  // -----------------------------------------------------------------------
  // Mutations (create / update / delete)
  // -----------------------------------------------------------------------
  const createMut = useMutation({
    mutationFn: async (payload: ItemForm) => {
      const res = await fetch(`/api/master/${activeTab}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Create failed")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Created")
      queryClient.invalidateQueries({ queryKey: ["master", activeTab] })
    },
    onError: (err: any) => toast.error(err.message),
  })

  const updateMut = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ItemForm }) => {
      const res = await fetch(`/api/master/${activeTab}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Update failed")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Updated")
      queryClient.invalidateQueries({ queryKey: ["master", activeTab] })
    },
    onError: (err: any) => toast.error(err.message),
  })

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/master/${activeTab}/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Deleted")
      queryClient.invalidateQueries({ queryKey: ["master", activeTab] })
    },
    onError: (err: any) => toast.error(err.message),
  })

  // -----------------------------------------------------------------------
  // Form handling (add / edit)
  // -----------------------------------------------------------------------
  const {
    register,
    handleSubmit,
    reset,
    setValue,
  } = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
    defaultValues: { name: "", code: "", isActive: true },
  })

  const onSubmit: SubmitHandler<ItemForm> = (data) => {
    if (editItem) {
      updateMut.mutate({ id: editItem.id, data })
    } else {
      createMut.mutate(data)
    }
    setDialogOpen(false)
    reset()
    setEditItem(null)
  }

  const startEdit = (item: MasterItem) => {
    setEditItem(item)
    setValue("name", item.name)
    setValue("code", item.code)
    setValue("isActive", item.isActive)
    setDialogOpen(true)
  }

  // -----------------------------------------------------------------------
  // Row animation variants
  // -----------------------------------------------------------------------
  const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Master Setup</h1>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MasterType)}>
        <TabsList className="grid w-full grid-cols-5">
          {masterTypes.map((t) => (
            <TabsTrigger key={t} value={t} className="capitalize">{t}</TabsTrigger>
          ))}
        </TabsList>
        {masterTypes.map((type) => (
          <TabsContent key={type} value={type} className="mt-4">
            <Button onClick={() => { setEditItem(null); setDialogOpen(true); }} className="mb-4">
              Add {type.slice(0, -1)}
            </Button>
            {isLoading ? (
              <div>Loading…</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items?.map((it) => (
                    <motion.tr
                      key={it.id}
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      className="border-t"
                    >
                      <TableCell>{it.name}</TableCell>
                      <TableCell>{it.code}</TableCell>
                      <TableCell>{it.isActive ? "Yes" : "No"}</TableCell>
                      <TableCell className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => startEdit(it)}>
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">Delete</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm delete</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{it.name}"?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMut.mutate(it.id)}
                              >
                                Delete
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
          </TabsContent>
        ))}
      </Tabs>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit" : "Add"} {activeTab.slice(0, -1)}</DialogTitle>
            <DialogDescription>
              {editItem ? "Update the existing item" : "Create a new item"}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input {...register("name")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Code</label>
              <Input {...register("code")} />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Active</label>
              <Switch {...register("isActive")} />
            </div>
            <DialogFooter>
              <Button type="submit">{editItem ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import type { Block, BlockInput } from "@/types/blocks"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { motion } from "framer-motion"
import { toast } from "sonner"



// Validation schema
const schema = z.object({
  yard: z.string().min(1),
  line: z.string().min(1),
  holdFor: z.enum(["Receive", "Deliver"]),
  containerNo: z.string().min(1),
  remarks: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function BlockContainerPage() {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, control } =
  useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  // Fetch block list
 const { data: blocks, isLoading } = useQuery<Block[]>({
  queryKey: ["blockList"],
  queryFn: async () => {
    const res = await fetch("/api/block")
    if (!res.ok) throw new Error("Failed to fetch blocks")
    return res.json()
  },
})

  // Create mutation
  const createMut = useMutation({
    mutationFn: async (payload: BlockInput) => {
      const res = await fetch("/api/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to create block")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Block created")
      queryClient.invalidateQueries({
  queryKey: ["blockList"],
})
      reset()
    },
    onError: (err: any) => toast.error(err.message),
  })

  // Allow mutation per block id
  const allowMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/block/${id}/allow`, { method: "PUT" })
      if (!res.ok) throw new Error("Failed to allow block")
      return res.json()
    },
   onSuccess: () => {
  toast.success("Block allowed")
  queryClient.invalidateQueries({
    queryKey: ["blockList"],
  })
},
    onError: (err: any) => toast.error(err.message),
  })

  const onSubmit = (data: FormValues) => {
    createMut.mutate(data)
  }

  const handleAllow = (id: string) => {
    allowMut.mutate(id)
  }

  // Row animation variants
  const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.div className="p-4 space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Create Block Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create Block</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Yard" {...register("yard")} />
            <Input placeholder="Line" {...register("line")} />
            <div className="flex items-center space-x-4">
              <span>Hold For</span>
              <Controller
  control={control}
  name="holdFor"
  render={({ field }) => (
    <RadioGroup
      value={field.value}
      onValueChange={field.onChange}
      className="flex space-x-4"
    >
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="Receive" id="receive" />
        <label htmlFor="receive">Receive</label>
      </div>

      <div className="flex items-center space-x-2">
        <RadioGroupItem value="Deliver" id="deliver" />
        <label htmlFor="deliver">Deliver</label>
      </div>
    </RadioGroup>
  )}
/>
            </div>
            <Input placeholder="Container No" {...register("containerNo")} />
            <Input placeholder="Remarks" {...register("remarks")} />
            <Button type="submit" disabled={createMut.isPending}>Create Block</Button>
          </form>
        </CardContent>
      </Card>

      {/* Block List */}
      <Card>
        <CardHeader>
          <CardTitle>Blocked Containers</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading…</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Line</TableHead>
                  <TableHead>Container</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Allow</TableHead>
                  <TableHead>Receive</TableHead>
                  <TableHead>Deliver</TableHead>
                  <TableHead>Allow Date</TableHead>
                  <TableHead>Amend User</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blocks && blocks.map((b: Block) => (
                  <motion.tr
                    key={b.id}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    className={b.isAllowed ? "bg-green-100" : "bg-red-100"}
                  >
                    <TableCell>{b.line?.name ?? b.lineId}</TableCell>
                    <TableCell>{b.containerNo}</TableCell>
                    <TableCell>{b.remarks}</TableCell>
                    <TableCell>{b.createdByUser?.username}</TableCell>
                    <TableCell>{new Date(b.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{b.isAllowed ? "Yes" : "No"}</TableCell>
                    <TableCell>{b.holdFor}</TableCell>
                    <TableCell>{b.holdFor}</TableCell>
                    <TableCell>{b.allowDate ? new Date(b.allowDate).toLocaleString() : "-"}</TableCell>
                    <TableCell>{b.amendedByUser?.username}</TableCell>
                    <TableCell className="space-x-2">
                      {/* Allow button with confirmation */}
                      {!b.isAllowed && (
                        <AlertDialog>
                          <AlertDialogTrigger>
                            <Button variant="outline" size="sm">Allow</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirm Allow</AlertDialogTitle>
                              <AlertDialogDescription>Mark container {b.containerNo} as allowed?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleAllow(b.id)}>Confirm</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {/* Ignore – simply delete (not implemented) */}
                      <Button variant="destructive" size="sm" onClick={() => toast.error("Ignore not implemented")}>Ignore</Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

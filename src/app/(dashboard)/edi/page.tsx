
"use client"

import React, { useState, DragEvent } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { toast } from "sonner"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface PreviewRow {
  id: string
  description: string
  error?: string // non‑empty indicates a problem
}

// ---------------------------------------------------------------------------
export default function EdiPage() {
  const ediTabs = ["booking", "codeco", "oldxsl", "newyardxsl"] as const
  type EdiTab = typeof ediTabs[number]
  const [activeTab, setActiveTab] = useState<EdiTab>(ediTabs[0])

  // ---------- CODECO tab data ------------------------------------------------
  const { data: codecoData, isLoading: codecoLoading } = useQuery<any[]>({
    queryKey: ["edi", "codeco"],
    queryFn: async () => {
      const res = await fetch("/api/edi/codeco")
      if (!res.ok) throw new Error("Failed to fetch CODECO data")
      return res.json()
    },
    enabled: activeTab === "codeco",
  })

  // ---------- File upload handling -------------------------------------------
  const [previewRows, setPreviewRows] = useState<PreviewRow[] | null>(null)
  const [uploading, setUploading] = useState(false)

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/edi/upload", {
        method: "POST",
        body: form,
      })
      if (!res.ok) throw new Error("Upload failed")
      return res.json() // expect array of PreviewRow
    },
    onSuccess: (data) => {
      setPreviewRows(data)
      toast.success("File uploaded – preview ready")
    },
    onError: (err: any) => toast.error(err.message),
  })

  const confirmMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/edi/confirm", { method: "POST" })
      if (!res.ok) throw new Error("Confirm failed")
      return res.json()
    },
    onSuccess: (data) => {
      toast.success(`EDI confirmed: ${data.message || "success"}`)
      setPreviewRows(null)
    },
    onError: (err: any) => toast.error(err.message),
  })

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files.length === 0) return
    const file = e.dataTransfer.files[0]
    setUploading(true)
    uploadMut.mutate(file, {
      onSettled: () => setUploading(false),
    })
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  // ---------- Row animation ---------------------------------------------------
  const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">EDI Management</h1>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EdiTab)}>
        <TabsList className="grid w-full grid-cols-4">
          {ediTabs.map((t) => (
            <TabsTrigger key={t} value={t} className="uppercase">
              {t}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ---------- Booking tab – upload workflow ---------- */}
        <TabsContent value="booking" className="mt-4">
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {uploading ? "Uploading…" : "Drag & drop an EDI file here to upload"}
          </div>

          {/* Preview dialog */}
          {previewRows && (
            <Dialog open={true} onOpenChange={(open) => !open && setPreviewRows(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Preview</DialogTitle>
                  <DialogDescription>Rows highlighted in red contain errors.</DialogDescription>
                </DialogHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row) => (
                      <motion.tr
                        key={row.id}
                        variants={rowVariants}
                        initial="hidden"
                        animate="visible"
                        className={row.error ? "bg-red-50" : undefined}
                      >
                        <TableCell>{row.id}</TableCell>
                        <TableCell>{row.description}</TableCell>
                        <TableCell className={row.error ? "text-red-600" : "text-green-600"}>
                          {row.error ? row.error : "OK"}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
                <DialogFooter className="flex justify-end space-x-2">
                  <AlertDialog>
                    <AlertDialogTrigger >
                      <Button variant="destructive">Confirm</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm EDI Upload</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will submit the uploaded data for processing.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => confirmMut.mutate()}>Proceed</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        {/* ---------- CODECO tab ---------- */}
        <TabsContent value="codeco" className="mt-4">
          {codecoLoading ? (
            <div>Loading CODECO data…</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codecoData?.map((item) => (
                  <motion.tr
                    key={item.id}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    className="border-t"
                  >
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.status}</TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* ---------- OldXSL tab ---------- */}
        <TabsContent value="oldxsl" className="mt-4">
          <div className="text-muted-foreground">Old XSL functionality not implemented yet.</div>
        </TabsContent>

        {/* ---------- NewYardXSL tab ---------- */}
        <TabsContent value="newyardxsl" className="mt-4">
          <div className="text-muted-foreground">New Yard XSL functionality not implemented yet.</div>
        </TabsContent>
      </Tabs>
    </div>
  </motion.div>
)
}

// src/app/(dashboard)/gate-out/page.tsx

"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
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
import { motion } from "framer-motion"
import { toast } from "sonner"

// Zod schema for validation (includes Gate‑Out specific fields)
const formSchema = z.object({
  eirNo: z.string().min(1, "EIR No required"),
  yard: z.string().min(1),
  terminal: z.string().min(1),
  line: z.string().min(1),
  containerNo: z.string().regex(/^[A-Z]{4}\d{7}[A-Z]{2}\d$/ , "Invalid ISO container format"),
  size: z.enum(["20FT", "40FT"]),
  status: z.string().min(1),
  tareWt: z.string().optional(),
  heavy: z.boolean().optional(),
  blNumber: z.string().optional(),
  vessel: z.string().optional(),
  voyage: z.string().optional(),
  arrivalDate: z.string().optional(),
  consignee: z.string().optional(),
  clearingAgent: z.string().optional(),
  transporter: z.string().optional(),
  truckNo: z.string().optional(),
  exchangeRate: z.string().optional(),
  discount: z.string().optional(),
  condition: z.string().optional(),
  prevCondition: z.string().optional(),
  pnr: z.boolean().optional(),
  sendCodeco: z.boolean().optional(),
  bypassSurvey: z.boolean().optional(),
  // Gate‑Out extras
  lpNo: z.string().optional(),
  dischargePort: z.string().optional(),
  dischargeCode: z.string().optional(),
  destination: z.string().optional(),
  shipper: z.string().optional(),
  reUpdateExchange: z.boolean().optional(),
})

type FormData = z.infer<typeof formSchema>

export default function GateOutPage() {
  const [activeTab, setActiveTab] = useState("gate-out")
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(formSchema) })

  const [blockInfo, setBlockInfo] = useState<{ blocked: boolean; reason?: string } | null>(null)
  const [alertInfo, setAlertInfo] = useState<string | null>(null)

  // Today stats – reuse the existing endpoint and map to required cards
  const [stats, setStats] = useState<{ ft20: number; ft40: number; delivered: number; bookings: number }>({ ft20: 0, ft40: 0, delivered: 0, bookings: 0 })
  useEffect(() => {
    fetch("/api/eir/today-stats")
      .then((r) => r.json())
      .then((data) => {
        // The existing endpoint returns 20FT/40FT counts only via totalStock etc.; we map loosely
        setStats({
          ft20: data.ft20 || 0,
          ft40: data.ft40 || 0,
          delivered: data.todayGateOut || 0,
          bookings: data.todayBookings || 0,
        })
      })
      .catch(() => {})
  }, [])

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch("/api/eir/gate-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create Gate‑Out")
      const result = await res.json()
      toast.success("Gate‑Out created", { description: `EIR ${result.id}` })
      queryClient.invalidateQueries(["today-stats"]) // refresh stats
    } catch (e) {
      toast.error("Error", { description: (e as Error).message })
    }
  }

  // Container block check (reuse same endpoint as Gate‑In)
  const handleContainerBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const container = e.target.value.trim()
    if (!container) return
    try {
      const res = await fetch(`/api/eir/block-check?container=${container}`)
      const info = await res.json()
      if (info.blocked) setBlockInfo(info)
      else setBlockInfo(null)
    } catch {
      // ignore errors
    }
  }

  // Loading Program fetch on blur of LP No
  const handleLPBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const lpNo = e.target.value.trim()
    if (!lpNo) return
    try {
      const res = await fetch(`/api/eir/loading-program?lpNo=${lpNo}`)
      if (!res.ok) throw new Error("LP not found or inactive")
      const lp = await res.json()
      // Auto‑fill related fields
      setValue("line", lp.line ?? "")
      setValue("vessel", lp.vessel ?? "")
      setValue("shipper", lp.shipper ?? "")
      setValue("dischargePort", lp.dischargePort ?? "")
    } catch (e) {
      setAlertInfo((e as Error).message)
    }
  }

  // Quick condition insert helper
  const insertCondition = (text: string) => {
    const textarea = document.getElementById("condition") as HTMLTextAreaElement | null
    if (textarea) {
      textarea.value = textarea.value ? `${textarea.value}, ${text}` : text
    }
  }

  return (
    <motion.div className="p-4 space-y-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="gate-out">Gate‑Out</TabsTrigger>
          <TabsTrigger value="repo-out">Repo‑Out</TabsTrigger>
          <TabsTrigger value="up-country">UpCountry</TabsTrigger>
          <TabsTrigger value="amendment">Amendment</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Today stats – three cards */}
      <Card>
        <CardHeader>
          <CardTitle>Today Stats</CardTitle>
        </CardHeader>
        <CardContent className="flex space-x-4">
          <Badge variant="secondary">Delivered: {stats.delivered}</Badge>
          <Badge variant="secondary">Bookings: {stats.bookings}</Badge>
          <Badge variant="secondary">Balance: {stats.ft20 + stats.ft40}</Badge>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Core fields – same as Gate‑In */}
        <Input placeholder="EIR No" {...register("eirNo")} />
        <Input placeholder="Yard" {...register("yard")} />
        <Input placeholder="Terminal" {...register("terminal")} />
        <Input placeholder="Line" {...register("line")} />
        <Input placeholder="Container No" {...register("containerNo")} onBlur={handleContainerBlur} />
        <select {...register("size")}>
          <option value="20FT">20FT</option>
          <option value="40FT">40FT</option>
        </select>
        <Input placeholder="Status" {...register("status")} />
        <Input placeholder="TareWt" {...register("tareWt")} />
        <label className="flex items-center space-x-2"><input type="checkbox" {...register("heavy")} /> <span>Heavy</span></label>
        <Input placeholder="BL#" {...register("blNumber")} />
        <Input placeholder="Vessel" {...register("vessel")} />
        <Input placeholder="Voy" {...register("voyage")} />
        <Input placeholder="Arrival Date" type="date" {...register("arrivalDate")} />
        <Input placeholder="Consignee" {...register("consignee")} />
        <Input placeholder="Clearing Agent" {...register("clearingAgent")} />
        <Input placeholder="Transporter" {...register("transporter")} />
        <Input placeholder="Truck No" {...register("truckNo")} />
        <Input placeholder="Exchange Rate" {...register("exchangeRate")} />
        <Input placeholder="Discount" {...register("discount")} />

        {/* Gate‑Out extra fields */}
        <Input placeholder="LP No" {...register("lpNo")} onBlur={handleLPBlur} />
        <Input placeholder="Discharge Port" {...register("dischargePort")} />
        <Input placeholder="Discharge Code" {...register("dischargeCode")} />
        <Input placeholder="Destination" {...register("destination")} />
        <Input placeholder="Shipper" {...register("shipper")} />
        <label className="flex items-center space-x-2"><input type="checkbox" {...register("reUpdateExchange")} /> <span>Re‑Update Exchange</span></label>

        {/* Condition area */}
        <textarea id="condition" placeholder="Condition" {...register("condition")} className="border p-2 rounded" />
        <div className="flex space-x-2">
          {['DENTED','RUSTY','DIRTY','HOLED','BENT','TORN'].map((c) => (
            <Button key={c} type="button" variant="outline" size="sm" onClick={() => insertCondition(c)}>{c}</Button>
          ))}
        </div>
        <Input placeholder="Prev Condition (readonly)" {...register("prevCondition")} readOnly />
        <label className="flex items-center space-x-2"><input type="checkbox" {...register("pnr")} /> <span>PNR</span></label>
        <label className="flex items-center space-x-2"><input type="checkbox" {...register("sendCodeco")} /> <span>Send Codeco</span></label>
        <label className="flex items-center space-x-2"><input type="checkbox" {...register("bypassSurvey")} /> <span>Bypass Survey</span></label>

        {/* Action buttons */}
        <div className="flex space-x-2 col-span-2">
          <Button type="submit" disabled={isSubmitting}>Create</Button>
          <Button type="button" disabled={isSubmitting}>Amend</Button>
          <Button type="button" disabled={isSubmitting}>Add New</Button>
          <Button type="button" disabled={isSubmitting}>Print EIR</Button>
          <Button type="button" disabled={isSubmitting}>Receipt</Button>
          <Button type="button" disabled={isSubmitting}>Gatepass</Button>
          <Button type="button" disabled={isSubmitting}>Change Remarks</Button>
          <Button type="button" disabled={isSubmitting}>Cancel EIR</Button>
        </div>
      </form>

      {/* Block AlertDialog */}
      {blockInfo && blockInfo.blocked && (
        <AlertDialog open={true} onOpenChange={() => setBlockInfo(null)}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Blocked Container</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Container Blocked</AlertDialogTitle>
              <AlertDialogDescription>{blockInfo.reason ?? "This container is blocked."}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* LP fetch error AlertDialog */}
      {alertInfo && (
        <AlertDialog open={true} onOpenChange={() => setAlertInfo(null)}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">LP Issue</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Loading Program Issue</AlertDialogTitle>
              <AlertDialogDescription>{alertInfo}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </motion.div>
  )
}

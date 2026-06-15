// src/app/(dashboard)/reports/stock/page.tsx
"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { saveAs } from "file-saver"

type StockRecord = {
  size: string
  opening: { heavy: number; med: number; total: number; dmg: number }
  received: { heavy: number; med: number; total: number; dmg: number }
  delivered: { heavy: number; med: number; total: number; dmg: number }
  closing: { heavy: number; med: number; total: number; dmg: number }
}

export default function StockReportPage() {
  const [location, setLocation] = useState("")
  const [line, setLine] = useState("")
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [allYards, setAllYards] = useState(false)
  const [data, setData] = useState<StockRecord[]>([])

  const fetchReport = async () => {
    const params = new URLSearchParams()
    if (location) params.append("location", location)
    if (line) params.append("line", line)
    if (dateRange.from) params.append("from", dateRange.from.toISOString())
    if (dateRange.to) params.append("to", dateRange.to.toISOString())
    if (allYards) params.append("allYards", "true")
    try {
      const res = await fetch(`/api/reports/stock?${params.toString()}`)
      const json = await res.json()
      setData(json)
    } catch (e) {
      console.error(e)
      toast.error("Failed to load stock report")
    }
  }

  const downloadExcel = async () => {
    try {
      const res = await fetch(`/api/reports/stock?format=excel&${new URLSearchParams({ location, line }).toString()}`)
      if (!res.ok) throw new Error("Download failed")
      const blob = await res.blob()
      saveAs(blob, "stock_report.xlsx")
    } catch (e) {
      console.error(e)
      toast.error("Excel download failed")
    }
  }

  useEffect(() => {
    fetchReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Helper to flatten data for Recharts
  const chartData = data.map((r) => ({
    size: r.size,
    openingTotal: r.opening.total,
    receivedTotal: r.received.total,
    deliveredTotal: r.delivered.total,
    closingTotal: r.closing.total,
  }))

  return (
    <motion.div className="p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <Input placeholder="Line" value={line} onChange={(e) => setLine(e.target.value)} />
        <DatePicker
          placeholder="From"
          value={dateRange.from}
          onChange={(d) => setDateRange((p) => ({ ...p, from: d }))}
        />
        <DatePicker
          placeholder="To"
          value={dateRange.to}
          onChange={(d) => setDateRange((p) => ({ ...p, to: d }))}
        />
        <Select value={allYards ? "yes" : "no"} onValueChange={(v) => setAllYards(v === "yes")}>
          <SelectTrigger>
            <SelectValue placeholder="All Yards" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={fetchReport}>Apply</Button>
        <Button variant="secondary" onClick={downloadExcel}>Excel</Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Size</th>
              {['Opening', 'Received', 'Delivered', 'Closing'].map((h) => (
                <th key={h} colSpan={4} className="border p-2 text-center">{h}</th>
              ))}
            </tr>
            <tr>
              <th className="border p-2"></th>
              {Array(4).fill(null).map((_, i) => (
                <React.Fragment key={i}>
                  <th className="border p-2">Heavy</th>
                  <th className="border p-2">Med</th>
                  <th className="border p-2">Total</th>
                  <th className="border p-2">Dmg</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((r, idx) => (
              <tr key={idx} className="odd:bg-gray-50">
                <td className="border p-2 font-medium">{r.size}</td>
                {[r.opening, r.received, r.delivered, r.closing].map((section, sIdx) => (
                  <React.Fragment key={sIdx}>
                    <td className="border p-2">{section.heavy}</td>
                    <td className="border p-2">{section.med}</td>
                    <td className="border p-2">{section.total}</td>
                    <td className="border p-2">{section.dmg}</td>
                  </React.Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chart */}
      <div style={{ width: "100%", height: 400 }}>
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <XAxis dataKey="size" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="openingTotal" stackId="a" fill="#8884d8" name="Opening" />
            <Bar dataKey="receivedTotal" stackId="a" fill="#82ca9d" name="Received" />
            <Bar dataKey="deliveredTotal" stackId="a" fill="#ff7300" name="Delivered" />
            <Bar dataKey="closingTotal" stackId="a" fill="#d0ed57" name="Closing" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

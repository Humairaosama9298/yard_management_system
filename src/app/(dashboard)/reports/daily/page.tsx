"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { toast } from "sonner"

// shadcn UI components
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"

// Types
interface RecordItem {
  id: string
  gateDate: string | null
  mode: string
  status: string
  container: { containerNo: string; size: string }
  line: { name: string; code: string }
  yard: { name: string; code: string }
}

interface Yard {
  id: string
  name: string
}

interface ShippingLine {
  id: string
  name: string
}

export default function DailyReportPage() {
  // sorting state
  const [sortKey, setSortKey] = useState<string>("")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  // filters
  const [yardId, setYardId] = useState<string | undefined>(undefined)
const [lineId, setLineId] = useState<string | undefined>(undefined)
const [reportType, setReportType] = useState("AllMovement")
const [size, setSize] = useState<string | undefined>(undefined)
const [status, setStatus] = useState<string | undefined>(undefined)

const [bookingNo, setBookingNo] = useState("")
const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
const [dateTo, setDateTo] = useState<Date | undefined>(undefined)
const [allYards, setAllYards] = useState(false)
const [onlyExcel, setOnlyExcel] = useState(false)

  const buildQueryString = () => {
    const params = new URLSearchParams()

    if (!allYards && yardId) params.append("yardId", yardId)
    if (lineId) params.append("lineId", lineId)
    if (reportType) params.append("reportType", reportType)
    if (size) params.append("size", size)
    if (status) params.append("status", status)
    if (bookingNo) params.append("bookingNo", bookingNo)
    if (dateFrom) params.append("from", dateFrom.toISOString())
    if (dateTo) params.append("to", dateTo.toISOString())
    params.append("allYards", String(allYards))

    return params.toString()
  }

  // Yards
  const yardsQuery = useQuery<Yard[]>({
    queryKey: ["yards"],
    queryFn: async () => {
      const res = await fetch("/api/yards")
      if (!res.ok) throw new Error("Failed to fetch yards")
      return res.json()
    },
  })

  // Shipping lines
  const linesQuery = useQuery<ShippingLine[]>({
    queryKey: ["shippingLines"],
    queryFn: async () => {
      const res = await fetch("/api/shipping-lines")
      if (!res.ok) throw new Error("Failed to fetch shipping lines")
      return res.json()
    },
  })

  // Report data
  const {
    data: records,
    isLoading,
    refetch,
  } = useQuery<RecordItem[]>({
    queryKey: ["dailyReport"],
    queryFn: async () => {
      const res = await fetch(`/api/reports/daily?${buildQueryString()}`)
      if (!res.ok) throw new Error("Failed to fetch report")
      return res.json()
    },
    enabled: false,
  })

  const handleSearch = () => {
    refetch()
  }

  const handleExportExcel = async () => {
    try {
      const res = await fetch(`/api/reports/daily/excel?${buildQueryString()}`)
      if (!res.ok) throw new Error("Excel export failed")

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = "daily_report.xlsx"
      a.click()

      URL.revokeObjectURL(url)
      toast.success("Excel downloaded")
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const handlePrint = () => window.print()

  // helper for sorting
  const getValue = (row: RecordItem, key: string) => {
    switch (key) {
      case "gateDate":
        return row.gateDate ?? ""
      case "mode":
        return row.mode ?? ""
      case "status":
        return row.status ?? ""
      case "containerNo":
        return row.container?.containerNo ?? ""
      case "size":
        return row.container?.size ?? ""
      case "lineName":
        return row.line?.name ?? ""
      case "yardName":
        return row.yard?.name ?? ""
      default:
        return ""
    }
  }

  const sortedRecords = useMemo(() => {
    if (!records) return []

    const data = [...records]

    if (!sortKey) return data

    return data.sort((a, b) => {
      const aVal = getValue(a, sortKey)
      const bVal = getValue(b, sortKey)

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1
      return 0
    })
  }, [records, sortKey, sortDir])

  const columns = [
    { header: "Gate Date", key: "gateDate" },
    { header: "Mode", key: "mode" },
    { header: "Status", key: "status" },
    { header: "Container", key: "containerNo" },
    { header: "Size", key: "size" },
    { header: "Line", key: "lineName" },
    { header: "Yard", key: "yardName" },
  ]

  return (
    <motion.div className="p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="text-2xl font-bold mb-4">Daily Report</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">

       <Select
  value={yardId ?? "ALL"}
  onValueChange={(value: string) => {
    setYardId(value === "ALL" ? undefined : value)
  }}
>
  <SelectTrigger>
    <SelectValue placeholder="Yard" />
  </SelectTrigger>

  <SelectContent>
    {yardsQuery.data?.map((y) => (
      <SelectItem key={y.id} value={y.id}>
        {y.name}
      </SelectItem>
    ))}

    <SelectItem value="ALL">All Yards</SelectItem>
  </SelectContent>
</Select>

        <Select
  value={lineId ?? "ALL"}
  onValueChange={(value: string) => {
    setLineId(value === "ALL" ? undefined : value)
  }}
>
  <SelectTrigger>
    <SelectValue placeholder="Line" />
  </SelectTrigger>

  <SelectContent>
    {linesQuery.data?.map((l) => (
      <SelectItem key={l.id} value={l.id}>
        {l.name}
      </SelectItem>
    ))}

    <SelectItem value="ALL">All Lines</SelectItem>
  </SelectContent>
</Select>

        <Select onValueChange={setReportType} value={reportType}>
          <SelectTrigger><SelectValue placeholder="Report Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Gate-In">Gate-In</SelectItem>
            <SelectItem value="Gate-Out">Gate-Out</SelectItem>
            <SelectItem value="AllMovement">AllMovement</SelectItem>
            <SelectItem value="Hold">Hold</SelectItem>
            <SelectItem value="Booking">Booking</SelectItem>
            <SelectItem value="Collection">Collection</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={setSize} value={size}>
          <SelectTrigger><SelectValue placeholder="Size" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any</SelectItem>
            <SelectItem value="DV20">DV20</SelectItem>
            <SelectItem value="DV40">DV40</SelectItem>
            <SelectItem value="HC40">HC40</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={setStatus} value={status}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any</SelectItem>
            <SelectItem value="HELD">Held</SelectItem>
            <SelectItem value="BOOKED">Booked</SelectItem>
            <SelectItem value="COLLECTED">Collected</SelectItem>
          </SelectContent>
        </Select>

        <Input placeholder="Booking No" value={bookingNo} onChange={e => setBookingNo(e.target.value)} />

        <DatePicker placeholder="From" value={dateFrom} onChange={setDateFrom} />
        <DatePicker placeholder="To" value={dateTo} onChange={setDateTo} />

        <div className="flex items-center space-x-2">
          <Checkbox checked={allYards} onCheckedChange={(v) => setAllYards(!!v)} />
          <label>All Yards</label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox checked={onlyExcel} onCheckedChange={(v) => setOnlyExcel(!!v)} />
          <label>Only Excel</label>
        </div>

        <Button onClick={handleSearch}>Search</Button>
        <Button variant="secondary" onClick={handleExportExcel}>Export Excel</Button>
        <Button variant="outline" onClick={handlePrint}>Print</Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div>Loading...</div>
      ) : sortedRecords.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(col => (
                <TableHead
                  key={col.key}
                  onClick={() => {
                    if (sortKey === col.key) {
                      setSortDir(sortDir === "asc" ? "desc" : "asc")
                    } else {
                      setSortKey(col.key)
                      setSortDir("asc")
                    }
                  }}
                  className="cursor-pointer"
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedRecords.map(r => (
              <TableRow key={r.id}>
                {columns.map(col => (
                  <TableCell key={col.key}>
                    {getValue(r, col.key)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div>No records found.</div>
      )}
    </motion.div>
  )
}
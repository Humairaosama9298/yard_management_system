"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { UploadButton } from "@uploadthing/react"

type FormState = {
  id?: string
  yard: string
  container: string
  size?: "DV20" | "DV40"
  status?: "SOUND" | "DAMAGE"
  condition: string
  photos: string[]
}

const damageOptions = ["DENTED", "RUSTY", "DIRTY", "HOLED", "BENT", "TORN"] as const

export default function SurveyPage() {
  const [search, setSearch] = useState("")
  const [lineFilter, setLineFilter] = useState("")
  const [surveys, setSurveys] = useState<any[]>([])

  const [form, setForm] = useState<FormState>({
    id: "",
    yard: "",
    container: "",
    size: undefined,
    status: undefined,
    condition: "",
    photos: [],
  })

  // Load surveys
  useEffect(() => {
    fetch("/api/survey")
      .then((r) => r.json())
      .then(setSurveys)
      .catch(console.error)
  }, [])

  const resetForm = () => {
    setForm({
      id: "",
      yard: "",
      container: "",
      size: undefined,
      status: undefined,
      condition: "",
      photos: [],
    })
  }

  const handleSave = async () => {
    const res = await fetch("/api/survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      const newSurvey = await res.json()
      setSurveys((prev) => [...prev, newSurvey])
      toast.success("Survey saved")
      resetForm()
    } else {
      toast.error("Failed to save survey")
    }
  }

  const handleAmend = async () => {
    if (!form.id) return toast.error("Select a survey first")

    const res = await fetch(`/api/survey/${form.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      const updated = await res.json()
      setSurveys((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
      toast.success("Survey amended")
    } else {
      toast.error("Failed to amend")
    }
  }

  const handleDelete = async () => {
    if (!form.id) return toast.error("Select a survey first")

    const res = await fetch(`/api/survey/${form.id}`, {
      method: "DELETE",
    })

    if (res.ok) {
      setSurveys((prev) => prev.filter((s) => s.id !== form.id))
      toast.success("Deleted")
      resetForm()
    } else {
      toast.error("Delete failed")
    }
  }

  const filtered = surveys.filter(
    (s) =>
      (!search || s.containerNo?.includes(search)) &&
      (!lineFilter || s.line?.includes(lineFilter))
  )

  return (
    <motion.div className="p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      
      {/* Search */}
      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Container No"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Input
          placeholder="Line"
          value={lineFilter}
          onChange={(e) => setLineFilter(e.target.value)}
        />
      </div>

      {/* Form */}
      <div className="grid grid-cols-2 gap-4 mb-4">

        <Input
          placeholder="Yard"
          value={form.yard}
          onChange={(e) => setForm({ ...form, yard: e.target.value })}
        />

        <Input
          placeholder="Container"
          value={form.container}
          onChange={(e) => setForm({ ...form, container: e.target.value })}
        />

        {/* SIZE */}
        <Select
          value={form.size ?? ""}
          onValueChange={(v) =>
            setForm((prev) => ({ ...prev, size: v as FormState["size"], }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DV20">DV20</SelectItem>
            <SelectItem value="DV40">DV40</SelectItem>
          </SelectContent>
        </Select>

        {/* STATUS */}
        <Select
  value={form.status ?? ""}
  onValueChange={(v) =>
    setForm((prev) => ({
      ...prev,
      status: v as FormState["status"],
    }))
  }
>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SOUND">SOUND</SelectItem>
            <SelectItem value="DAMAGE">DAMAGE</SelectItem>
          </SelectContent>
        </Select>

        <Textarea
          placeholder="Condition"
          value={form.condition}
          onChange={(e) => setForm({ ...form, condition: e.target.value })}
        />

        {/* Quick damage buttons */}
        <div className="flex gap-2 col-span-2">
          {damageOptions.map((opt) => (
            <Button
              key={opt}
              variant="outline"
              onClick={() => setForm({ ...form, condition: opt })}
            >
              {opt}
            </Button>
          ))}
        </div>

        {/* UploadThing */}
        <UploadButton
          endpoint="imageUploader"
          onClientUploadComplete={(res: any) => {
            const urls = res?.map((f: any) => f.fileUrl) || []
            setForm((prev) => ({
              ...prev,
              photos: [...prev.photos, ...urls],
            }))
            toast.success("Photos uploaded")
          }}
          onUploadError={() => toast.error("Upload error")}
        />

        {/* Thumbnails */}
        <div className="flex gap-2 col-span-2 mt-2">
          {form.photos.map((p) => (
            <img key={p} src={p} className="h-16 w-16 object-cover" />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-4">
        <Button onClick={handleSave}>Save</Button>
        <Button onClick={handleAmend}>Amend</Button>
        <Button variant="destructive" onClick={handleDelete}>
          Delete
        </Button>
        <Button variant="secondary" onClick={resetForm}>
          New
        </Button>
      </div>

      {/* List */}
      <div className="grid gap-2">
        {filtered.map((s) => (
          <div
            key={s.id}
            className="p-2 border rounded cursor-pointer"
            onClick={() =>
              setForm({
                id: s.id,
                yard: s.yard ?? "",
                container: s.containerNo ?? "",
                size: undefined,
                status: s.status,
                condition: s.condition,
                photos: [],
              })
            }
          >
            {s.containerNo} – {s.status} – {s.condition}
          </div>
        ))}
      </div>
    </motion.div>
  )
}
"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { DatePicker } from "@/components/ui/date-picker"

// Simple lightbox
function Lightbox({ src, onClose, onPrev, onNext }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <img src={src} alt="full" className="max-h-full max-w-full" />
      <Button variant="ghost" onClick={(e) => { e.stopPropagation(); onPrev(); }} className="absolute left-4 top-1/2">←</Button>
      <Button variant="ghost" onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute right-4 top-1/2">→</Button>
    </div>
  )
}

export default function PicturesPage() {
  const [filter, setFilter] = useState("container") // or "date"
  const [container, setContainer] = useState("")
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined })
  const [photos, setPhotos] = useState<any[]>([])
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  const load = async () => {
    const params = new URLSearchParams()
    if (filter === "container" && container) params.append("container", container)
    if (filter === "date") {
      if (dateRange.from) params.append("from", dateRange.from.toISOString())
      if (dateRange.to) params.append("to", dateRange.to.toISOString())
    }
    const res = await fetch(`/api/photos?${params.toString()}`)
    const data = await res.json()
    setPhotos(data)
  }

  useEffect(() => { load() }, [filter, container, dateRange])

  const openLightbox = (idx) => setLightboxIdx(idx)
  const closeLightbox = () => setLightboxIdx(null)
  const prev = () => setLightboxIdx((i) => (i! - 1 + photos.length) % photos.length)
  const next = () => setLightboxIdx((i) => (i! + 1) % photos.length)

  return (
    <motion.div className="p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Filter toggle */}
      <RadioGroup value={filter} onValueChange={setFilter} className="flex gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="container" id="container" />
          <label htmlFor="container">By Container</label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="date" id="date" />
          <label htmlFor="date">By Date</label>
        </div>
      </RadioGroup>

      {filter === "container" && (
        <Input placeholder="Container No" value={container} onChange={(e) => setContainer(e.target.value)} className="mb-4" />
      )}

      {filter === "date" && (
        <div className="flex gap-4 mb-4">
          <DatePicker
            placeholder="From"
            value={dateRange.from}
            onChange={(d) => setDateRange((prev) => ({ ...prev, from: d }))}
          />
          <DatePicker
            placeholder="To"
            value={dateRange.to}
            onChange={(d) => setDateRange((prev) => ({ ...prev, to: d }))}
          />
        </div>
      )}

      {/* Photo grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {photos.map((p, idx) => (
          <motion.img
            key={p.id}
            src={p.fileUrl}
            alt="thumb"
            className="object-cover w-full h-32 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            onClick={() => openLightbox(idx)}
          />
        ))}
      </div>

      {lightboxIdx !== null && (
        <Lightbox
          src={photos[lightboxIdx].fileUrl}
          onClose={closeLightbox}
          onPrev={prev}
          onNext={next}
        />
      )}
    </motion.div>
  )
}

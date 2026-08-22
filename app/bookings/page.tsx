"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader, Card, Field, Input, Select, Button } from "@/components/ui";

type Opt = { id: string; name: string };

export default function Bookings() {
  const [lines, setLines] = useState<Opt[]>([]);
  const [terminals, setTerminals] = useState<Opt[]>([]);
  const [yards, setYards] = useState<Opt[]>([]);
  const [shippers, setShippers] = useState<Opt[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    lp_no: "",
    line_id: "",
    terminal_id: "",
    yard_id: "",
    vessel_name: "",
    voyage: "",
    loading_port: "",
    discharge_port: "",
    destination_port: "",
    shipper_id: "",
    size: "40HQ",
    quantity: 1,
  });

  async function loadOptions() {
    const [l, t, y, s] = await Promise.all([
      supabase.from("companies").select("id, name").eq("type", "shipping_line").order("name"),
      supabase.from("terminals").select("id, name").order("name"),
      supabase.from("yards").select("id, name").order("name"),
      supabase.from("companies").select("id, name").eq("type", "shipper").order("name"),
    ]);
    setLines(l.data ?? []);
    setTerminals(t.data ?? []);
    setYards(y.data ?? []);
    setShippers(s.data ?? []);
  }

  async function loadBookings() {
    const { data } = await supabase
      .from("bookings")
      .select("lp_no, size, quantity, picked, loading_port, discharge_port, destination_port, created_at, companies!bookings_line_id_fkey(name), vessel:vessels(name, voyage)")
      .order("created_at", { ascending: false })
      .limit(15);
    setBookings(data ?? []);
  }

  useEffect(() => { loadOptions(); loadBookings(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.lp_no || !form.line_id) return;
    setSaving(true);

    let vesselId: string | null = null;
    if (form.vessel_name) {
      const { data: v } = await supabase.from("vessels").insert({ name: form.vessel_name, voyage: form.voyage }).select("id").single();
      vesselId = v?.id ?? null;
    }

    await supabase.from("bookings").insert({
      lp_no: form.lp_no,
      line_id: form.line_id,
      terminal_id: form.terminal_id || null,
      yard_id: form.yard_id || null,
      vessel_id: vesselId,
      loading_port: form.loading_port,
      discharge_port: form.discharge_port,
      destination_port: form.destination_port,
      shipper_id: form.shipper_id || null,
      size: form.size,
      quantity: form.quantity,
    });

    setForm({ ...form, lp_no: "", vessel_name: "", voyage: "", loading_port: "", discharge_port: "", destination_port: "", quantity: 1 });
    await loadBookings();
    setSaving(false);
  }

  return (
    <div>
      <PageHeader eyebrow="Bookings" title="Loading Program" subtitle="Vessel booking details for export loading." />
      <div className="p-8 grid grid-cols-3 gap-6">
        <Card className="col-span-2 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="LP No" required>
                <Input value={form.lp_no} onChange={(e) => setForm({ ...form, lp_no: e.target.value })} placeholder="2324444010" />
              </Field>
              <Field label="Line Name" required>
                <Select value={form.line_id} onChange={(e) => setForm({ ...form, line_id: e.target.value })}>
                  <option value="">Select line</option>
                  {lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Terminal">
                <Select value={form.terminal_id} onChange={(e) => setForm({ ...form, terminal_id: e.target.value })}>
                  <option value="">Select terminal</option>
                  {terminals.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </Field>
              <Field label="Yard">
                <Select value={form.yard_id} onChange={(e) => setForm({ ...form, yard_id: e.target.value })}>
                  <option value="">Select yard</option>
                  {yards.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Vessel Name">
                <Input value={form.vessel_name} onChange={(e) => setForm({ ...form, vessel_name: e.target.value })} placeholder="XIN LOS ANGELES" />
              </Field>
              <Field label="Voyage">
                <Input value={form.voyage} onChange={(e) => setForm({ ...form, voyage: e.target.value })} placeholder="178E" />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Loading Port">
                <Input value={form.loading_port} onChange={(e) => setForm({ ...form, loading_port: e.target.value })} placeholder="Karachi" />
              </Field>
              <Field label="Discharge Port">
                <Input value={form.discharge_port} onChange={(e) => setForm({ ...form, discharge_port: e.target.value })} placeholder="Chittagong" />
              </Field>
              <Field label="Final Destination">
                <Input value={form.destination_port} onChange={(e) => setForm({ ...form, destination_port: e.target.value })} placeholder="Chittagong" />
              </Field>
            </div>
            <Field label="Shipper">
              <Select value={form.shipper_id} onChange={(e) => setForm({ ...form, shipper_id: e.target.value })}>
                <option value="">Select shipper</option>
                {shippers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Size">
                <Select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}>
                  {["20GP", "40GP", "40HQ", "40FR"].map((s) => <option key={s}>{s}</option>)}
                </Select>
              </Field>
              <Field label="Quantity">
                <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
              </Field>
            </div>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Create Booking"}</Button>
          </form>
        </Card>

        <Card className="h-fit">
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--line)" }}>
            <h3 className="font-display font-semibold text-[14px]">Recent Bookings</h3>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--line)" }}>
            {bookings.map((b, i) => (
              <div key={i} className="px-5 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[13px] font-medium">{b.lp_no}</span>
                  <span className="text-[11px] font-mono" style={{ color: "var(--slate)" }}>{b.size} × {b.quantity}</span>
                </div>
                <div className="text-[11px] mt-1" style={{ color: "var(--slate)" }}>
                  {b.loading_port} → {b.destination_port}
                </div>
              </div>
            ))}
            {bookings.length === 0 && (
              <div className="px-5 py-8 text-center text-sm" style={{ color: "var(--slate)" }}>No bookings yet.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

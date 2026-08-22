"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader, Card, Field, Input, Select, Button, Badge } from "@/components/ui";

type Opt = { id: string; name: string };
type Slot = { id: string; block: string; slot_no: string; is_occupied: boolean; yard_id: string };

export default function Yard() {
  const [yards, setYards] = useState<Opt[]>([]);
  const [yardId, setYardId] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [containers, setContainers] = useState<any[]>([]);
  const [form, setForm] = useState({ block: "", slot_no: "" });
  const [assignForm, setAssignForm] = useState({ container_id: "", slot_id: "" });
  const [saving, setSaving] = useState(false);

  async function loadYards() {
    const { data } = await supabase.from("yards").select("id, name").order("name");
    setYards(data ?? []);
    if (data && data.length > 0 && !yardId) setYardId(data[0].id);
  }

  async function loadSlots(y: string) {
    if (!y) return;
    const { data } = await supabase.from("yard_slots").select("*").eq("yard_id", y).order("block");
    setSlots(data ?? []);
  }

  async function loadContainers() {
    const { data } = await supabase.from("containers").select("id, container_no, size").eq("current_state", "IN_YARD").is("slot_id", null);
    setContainers(data ?? []);
  }

  useEffect(() => { loadYards(); loadContainers(); }, []);
  useEffect(() => { if (yardId) loadSlots(yardId); }, [yardId]);

  async function addSlot(e: React.FormEvent) {
    e.preventDefault();
    if (!form.block || !form.slot_no || !yardId) return;
    setSaving(true);
    await supabase.from("yard_slots").insert({ yard_id: yardId, block: form.block, slot_no: form.slot_no });
    setForm({ block: "", slot_no: "" });
    await loadSlots(yardId);
    setSaving(false);
  }

  async function assignContainer(e: React.FormEvent) {
    e.preventDefault();
    if (!assignForm.container_id || !assignForm.slot_id) return;
    setSaving(true);
    await supabase.from("containers").update({ slot_id: assignForm.slot_id, yard_id: yardId }).eq("id", assignForm.container_id);
    await supabase.from("yard_slots").update({ is_occupied: true }).eq("id", assignForm.slot_id);
    setAssignForm({ container_id: "", slot_id: "" });
    await Promise.all([loadSlots(yardId), loadContainers()]);
    setSaving(false);
  }

  return (
    <div>
      <PageHeader eyebrow="Storage" title="Yard Slots" subtitle="Block/slot layout and container stacking assignment." />
      <div className="p-4 md:p-8 space-y-6">
        <Card className="p-4">
          <Field label="Yard">
            <Select value={yardId} onChange={(e) => setYardId(e.target.value)} className="max-w-xs">
              {yards.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
            </Select>
          </Field>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-5 h-fit space-y-6">
            <div>
              <h3 className="font-display font-semibold text-[14px] mb-4">Add Slot</h3>
              <form onSubmit={addSlot} className="space-y-3">
                <Field label="Block" required>
                  <Input value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })} placeholder="A" />
                </Field>
                <Field label="Slot No" required>
                  <Input value={form.slot_no} onChange={(e) => setForm({ ...form, slot_no: e.target.value })} placeholder="01" />
                </Field>
                <Button type="submit" disabled={saving} className="w-full">Add Slot</Button>
              </form>
            </div>
            <div className="border-t pt-5" style={{ borderColor: "var(--line)" }}>
              <h3 className="font-display font-semibold text-[14px] mb-4">Assign Container</h3>
              <form onSubmit={assignContainer} className="space-y-3">
                <Field label="Container (unassigned)" required>
                  <Select value={assignForm.container_id} onChange={(e) => setAssignForm({ ...assignForm, container_id: e.target.value })}>
                    <option value="">Select</option>
                    {containers.map((c) => <option key={c.id} value={c.id}>{c.container_no} — {c.size}</option>)}
                  </Select>
                </Field>
                <Field label="Empty Slot" required>
                  <Select value={assignForm.slot_id} onChange={(e) => setAssignForm({ ...assignForm, slot_id: e.target.value })}>
                    <option value="">Select</option>
                    {slots.filter((s) => !s.is_occupied).map((s) => <option key={s.id} value={s.id}>{s.block}-{s.slot_no}</option>)}
                  </Select>
                </Field>
                <Button type="submit" disabled={saving} className="w-full">Assign</Button>
              </form>
            </div>
          </Card>

          <Card className="col-span-2">
            <div className="px-5 py-4 border-b" style={{ borderColor: "var(--line)" }}>
              <h3 className="font-display font-semibold text-[14px]">Slot Map</h3>
            </div>
            <div className="p-5 grid grid-cols-3 md:grid-cols-6 gap-3">
              {slots.map((s) => (
                <div
                  key={s.id}
                  className="rounded-md px-3 py-3 text-center"
                  style={{ background: s.is_occupied ? "#fef3e2" : "#e6f3ec", border: "1px solid var(--line)" }}
                >
                  <div className="font-mono text-[13px] font-semibold">{s.block}-{s.slot_no}</div>
                  <div className="text-[10px] mt-1" style={{ color: s.is_occupied ? "var(--amber-deep)" : "var(--ok)" }}>
                    {s.is_occupied ? "OCCUPIED" : "EMPTY"}
                  </div>
                </div>
              ))}
              {slots.length === 0 && (
                <div className="col-span-6 text-center py-10 text-sm" style={{ color: "var(--slate)" }}>No slots defined for this yard yet.</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

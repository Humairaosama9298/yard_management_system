"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader, Card, Field, Input, Select, TextArea, Button, Badge } from "@/components/ui";

type Opt = { id: string; name: string };

function genEIR() {
  const n = Math.floor(10000 + Math.random() * 89999);
  const d = new Date();
  const date = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  return `MP-D-${n}/${date}`;
}

export default function GateOut() {
  const [containers, setContainers] = useState<any[]>([]);
  const [terminals, setTerminals] = useState<Opt[]>([]);
  const [yards, setYards] = useState<Opt[]>([]);
  const [shippers, setShippers] = useState<Opt[]>([]);
  const [transporters, setTransporters] = useState<Opt[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    container_id: "",
    yard_id: "",
    terminal_id: "",
    shipper_id: "",
    transporter_id: "",
    truck_no: "",
    destination: "",
    remarks: "",
  });

  async function loadOptions() {
    const [ct, t, y, co] = await Promise.all([
      supabase.from("containers").select("id, container_no, size, status").eq("current_state", "IN_YARD").order("container_no"),
      supabase.from("terminals").select("id, name").order("name"),
      supabase.from("yards").select("id, name").order("name"),
      supabase.from("companies").select("id, name, type").in("type", ["shipper", "transporter"]).order("name"),
    ]);
    setContainers(ct.data ?? []);
    setTerminals(t.data ?? []);
    setYards(y.data ?? []);
    setShippers((co.data ?? []).filter((x: any) => x.type === "shipper"));
    setTransporters((co.data ?? []).filter((x: any) => x.type === "transporter"));
  }

  async function loadRecent() {
    const { data } = await supabase
      .from("gate_entries")
      .select("eir_no, truck_no, status, event_date, containers(container_no, size)")
      .eq("mode", "GATE_OUT")
      .order("event_date", { ascending: false })
      .limit(6);
    setRecent(data ?? []);
  }

  useEffect(() => {
    loadOptions();
    loadRecent();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.container_id || !form.yard_id || !form.terminal_id) {
      setMessage("Please fill required fields.");
      return;
    }
    setSaving(true);
    setMessage("");

    const eir = genEIR();
    await supabase.from("gate_entries").insert({
      eir_no: eir,
      container_id: form.container_id,
      mode: "GATE_OUT",
      yard_id: form.yard_id,
      terminal_id: form.terminal_id,
      transporter_id: form.transporter_id || null,
      truck_no: form.truck_no,
      status: "SOUND",
      remarks: form.remarks,
    });

    await supabase.from("containers").update({ current_state: "DISPATCHED" }).eq("id", form.container_id);

    setMessage(`Saved successfully — EIR: ${eir}`);
    setForm({ ...form, container_id: "", truck_no: "", destination: "", remarks: "" });
    await loadOptions();
    await loadRecent();
    setSaving(false);
  }

  return (
    <div>
      <PageHeader eyebrow="Gate Operations" title="Empty Container Gate-Out" subtitle="Release containers from yard for dispatch." />
      <div className="p-8 grid grid-cols-3 gap-6">
        <Card className="col-span-2 p-6">
          {message && (
            <div
              className="mb-4 px-4 py-2.5 rounded-md text-sm font-medium"
              style={{
                background: message.startsWith("Error") ? "#faeae6" : "#e6f3ec",
                color: message.startsWith("Error") ? "var(--danger)" : "var(--ok)",
              }}
            >
              {message}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Container No" required>
              <Select value={form.container_id} onChange={(e) => setForm({ ...form, container_id: e.target.value })}>
                <option value="">Select container in yard</option>
                {containers.map((c) => (
                  <option key={c.id} value={c.id}>{c.container_no} — {c.size} ({c.status})</option>
                ))}
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Yard Name" required>
                <Select value={form.yard_id} onChange={(e) => setForm({ ...form, yard_id: e.target.value })}>
                  <option value="">Select yard</option>
                  {yards.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
                </Select>
              </Field>
              <Field label="Terminal Name" required>
                <Select value={form.terminal_id} onChange={(e) => setForm({ ...form, terminal_id: e.target.value })}>
                  <option value="">Select terminal</option>
                  {terminals.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Shipper">
                <Select value={form.shipper_id} onChange={(e) => setForm({ ...form, shipper_id: e.target.value })}>
                  <option value="">Select shipper</option>
                  {shippers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </Field>
              <Field label="Transporter">
                <Select value={form.transporter_id} onChange={(e) => setForm({ ...form, transporter_id: e.target.value })}>
                  <option value="">Select transporter</option>
                  {transporters.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Truck No">
                <Input value={form.truck_no} onChange={(e) => setForm({ ...form, truck_no: e.target.value })} placeholder="TLR465" />
              </Field>
              <Field label="Destination">
                <Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="Chittagong" />
              </Field>
            </div>

            <Field label="Remarks">
              <TextArea rows={2} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
            </Field>

            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Create Gate-Out"}</Button>
          </form>
        </Card>

        <Card className="h-fit">
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--line)" }}>
            <h3 className="font-display font-semibold text-[14px]">Recent Gate-Outs</h3>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--line)" }}>
            {recent.map((r, i) => (
              <div key={i} className="px-5 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[13px] font-medium">{r.containers?.container_no}</span>
                  <Badge status={r.status} />
                </div>
                <div className="text-[11px] mt-1 font-mono" style={{ color: "var(--slate)" }}>{r.eir_no}</div>
              </div>
            ))}
            {recent.length === 0 && (
              <div className="px-5 py-8 text-center text-sm" style={{ color: "var(--slate)" }}>No entries yet.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader, Card, Field, Input, Select, TextArea, Button, Badge } from "@/components/ui";

type Opt = { id: string; name: string };

function genEIR() {
  const n = Math.floor(10000 + Math.random() * 89999);
  const d = new Date();
  const date = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  return `MP-R-${n}/${date}`;
}

export default function GateIn() {
  const [lines, setLines] = useState<Opt[]>([]);
  const [terminals, setTerminals] = useState<Opt[]>([]);
  const [yards, setYards] = useState<Opt[]>([]);
  const [transporters, setTransporters] = useState<Opt[]>([]);
  const [consignees, setConsignees] = useState<Opt[]>([]);
  const [clearingAgents, setClearingAgents] = useState<Opt[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    container_no: "",
    size: "40HQ",
    status: "SOUND",
    present_status: "",
    line_id: "",
    yard_id: "",
    terminal_id: "",
    consignee_id: "",
    transporter_id: "",
    truck_no: "",
    vessel_name: "",
    voyage: "",
    remarks: "",
    clearing_agent_id: "",
    tare_weight: "",
    heavy: false,
    bl_no: "",
    arrival_date: "",
    chalan_no: "",
  });

  async function loadOptions() {
    const [l, t, y, c] = await Promise.all([
      supabase.from("companies").select("id, name").eq("type", "shipping_line").order("name"),
      supabase.from("terminals").select("id, name").order("name"),
      supabase.from("yards").select("id, name").order("name"),
      supabase.from("companies").select("id, name, type").in("type", ["consignee", "transporter", "clearing_agent"]).order("name"),
    ]);
    setLines(l.data ?? []);
    setTerminals(t.data ?? []);
    setYards(y.data ?? []);
    setConsignees((c.data ?? []).filter((x: any) => x.type === "consignee"));
    setTransporters((c.data ?? []).filter((x: any) => x.type === "transporter"));
    setClearingAgents((c.data ?? []).filter((x: any) => x.type === "clearing_agent"));
  }

  async function loadRecent() {
    const { data } = await supabase
      .from("gate_entries")
      .select("eir_no, truck_no, status, event_date, containers(container_no, size)")
      .eq("mode", "GATE_IN")
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
    if (!form.container_no || !form.line_id || !form.yard_id || !form.terminal_id) {
      setMessage("Please fill required fields.");
      return;
    }
    setSaving(true);
    setMessage("");

    let vesselId: string | null = null;
    if (form.vessel_name) {
      const { data: v } = await supabase
        .from("vessels")
        .insert({ name: form.vessel_name, voyage: form.voyage })
        .select("id")
        .single();
      vesselId = v?.id ?? null;
    }

    const { data: container, error: cErr } = await supabase
      .from("containers")
      .insert({
        container_no: form.container_no.toUpperCase(),
        size: form.size,
        status: form.status,
        present_status: form.present_status,
        line_id: form.line_id,
        yard_id: form.yard_id,
        current_state: "IN_YARD",
        tare_weight: form.tare_weight ? Number(form.tare_weight) : null,
        heavy: form.heavy,
        bl_no: form.bl_no || null,
      })
      .select("id")
      .single();

    if (cErr) {
      setMessage("Error: " + cErr.message);
      setSaving(false);
      return;
    }

    const eir = genEIR();
    await supabase.from("gate_entries").insert({
      eir_no: eir,
      container_id: container.id,
      mode: "GATE_IN",
      yard_id: form.yard_id,
      terminal_id: form.terminal_id,
      vessel_id: vesselId,
      consignee_id: form.consignee_id || null,
      transporter_id: form.transporter_id || null,
      truck_no: form.truck_no,
      status: form.status,
      remarks: form.remarks,
      clearing_agent_id: form.clearing_agent_id || null,
      arrival_date: form.arrival_date || null,
      chalan_no: form.chalan_no || null,
    });

    if (form.status === "DAMAGE") {
      await supabase.from("damage_reports").insert({
        container_id: container.id,
        damage_notes: form.present_status,
      });
    }

    setMessage(`Saved successfully — EIR: ${eir}`);
    setForm({
      ...form,
      container_no: "",
      present_status: "",
      truck_no: "",
      vessel_name: "",
      voyage: "",
      remarks: "",
      tare_weight: "",
      heavy: false,
      bl_no: "",
      arrival_date: "",
      chalan_no: "",
    });
    await loadRecent();
    setSaving(false);
  }

  return (
    <div>
      <PageHeader eyebrow="Gate Operations" title="Container Gate-In" subtitle="Record arrival, condition and yard assignment." />
      <div className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Container No" required>
                <Input value={form.container_no} onChange={(e) => setForm({ ...form, container_no: e.target.value })} placeholder="OOCU6160542" />
              </Field>
              <Field label="Size" required>
                <Select value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}>
                  {["20GP", "40GP", "40HQ", "40FR", "20RF"].map((s) => <option key={s}>{s}</option>)}
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Line Name" required>
                <Select value={form.line_id} onChange={(e) => setForm({ ...form, line_id: e.target.value })}>
                  <option value="">Select line</option>
                  {lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </Select>
              </Field>
              <Field label="Terminal Name" required>
                <Select value={form.terminal_id} onChange={(e) => setForm({ ...form, terminal_id: e.target.value })}>
                  <option value="">Select terminal</option>
                  {terminals.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Yard Name" required>
                <Select value={form.yard_id} onChange={(e) => setForm({ ...form, yard_id: e.target.value })}>
                  <option value="">Select yard</option>
                  {yards.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
                </Select>
              </Field>
              <Field label="Status" required>
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="SOUND">SOUND</option>
                  <option value="DAMAGE">DAMAGE</option>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Vessel Name">
                <Input value={form.vessel_name} onChange={(e) => setForm({ ...form, vessel_name: e.target.value })} placeholder="ITAL UNIVERSO" />
              </Field>
              <Field label="Voyage">
                <Input value={form.voyage} onChange={(e) => setForm({ ...form, voyage: e.target.value })} placeholder="183" />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Consignee">
                <Select value={form.consignee_id} onChange={(e) => setForm({ ...form, consignee_id: e.target.value })}>
                  <option value="">Select consignee</option>
                  {consignees.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
              <Field label="Transporter">
                <Select value={form.transporter_id} onChange={(e) => setForm({ ...form, transporter_id: e.target.value })}>
                  <option value="">Select transporter</option>
                  {transporters.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Clearing Agent">
                <Select value={form.clearing_agent_id} onChange={(e) => setForm({ ...form, clearing_agent_id: e.target.value })}>
                  <option value="">Select clearing agent</option>
                  {clearingAgents.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
              <Field label="Arrival Date">
                <Input type="date" value={form.arrival_date} onChange={(e) => setForm({ ...form, arrival_date: e.target.value })} />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Tare Weight">
                <Input type="number" value={form.tare_weight} onChange={(e) => setForm({ ...form, tare_weight: e.target.value })} placeholder="32500" />
              </Field>
              <Field label="B/L No">
                <Input value={form.bl_no} onChange={(e) => setForm({ ...form, bl_no: e.target.value })} placeholder="B/L number" />
              </Field>
              <Field label="Chalan No">
                <Input value={form.chalan_no} onChange={(e) => setForm({ ...form, chalan_no: e.target.value })} placeholder="Chalan number" />
              </Field>
            </div>

            <label className="flex items-center gap-2 text-sm" style={{ color: "var(--steel)" }}>
              <input type="checkbox" checked={form.heavy} onChange={(e) => setForm({ ...form, heavy: e.target.checked })} />
              Heavy
            </label>

            <Field label="Truck No">
              <Input value={form.truck_no} onChange={(e) => setForm({ ...form, truck_no: e.target.value })} placeholder="TMB781" />
            </Field>

            <Field label="Present Status / Remarks">
              <TextArea rows={2} value={form.present_status} onChange={(e) => setForm({ ...form, present_status: e.target.value })} placeholder="NORMAL WEAR & TEAR (PNR)" />
            </Field>

            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Create Gate-In"}</Button>
          </form>
        </Card>

        <Card className="h-fit">
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--line)" }}>
            <h3 className="font-display font-semibold text-[14px]">Recent Gate-Ins</h3>
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

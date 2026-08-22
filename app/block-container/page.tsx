"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader, Card, Field, Input, Select, TextArea, Button } from "@/components/ui";

type Opt = { id: string; name: string };

export default function BlockContainer() {
  const [lines, setLines] = useState<Opt[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ line_id: "", hold_for: "RECEIVE", container_no: "", remarks: "" });

  async function loadLines() {
    const { data } = await supabase.from("companies").select("id, name").eq("type", "shipping_line").order("name");
    setLines(data ?? []);
  }

  async function loadRows() {
    const { data } = await supabase
      .from("block_containers")
      .select("id, container_no, hold_for, remarks, is_allowed, created_at, companies(name)")
      .order("created_at", { ascending: false });
    setRows(data ?? []);
  }

  useEffect(() => { loadLines(); loadRows(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.line_id) return;
    setSaving(true);
    await supabase.from("block_containers").insert({
      line_id: form.line_id,
      hold_for: form.hold_for,
      container_no: form.container_no || null,
      remarks: form.remarks,
    });
    setForm({ line_id: "", hold_for: "RECEIVE", container_no: "", remarks: "" });
    await loadRows();
    setSaving(false);
  }

  async function toggleAllow(id: string, current: boolean) {
    await supabase.from("block_containers").update({ is_allowed: !current }).eq("id", id);
    await loadRows();
  }

  return (
    <div>
      <PageHeader eyebrow="Hold Control" title="Block Container" subtitle="Hold containers or lines from receive/deliver with a reason." />
      <div className="p-8 grid grid-cols-3 gap-6">
        <Card className="p-5 h-fit">
          <h3 className="font-display font-semibold text-[14px] mb-4">New Hold</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Field label="Line Name" required>
              <Select value={form.line_id} onChange={(e) => setForm({ ...form, line_id: e.target.value })}>
                <option value="">Select line</option>
                {lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Select>
            </Field>
            <Field label="Hold For" required>
              <Select value={form.hold_for} onChange={(e) => setForm({ ...form, hold_for: e.target.value })}>
                <option value="RECEIVE">Receive</option>
                <option value="DELIVER">Deliver</option>
              </Select>
            </Field>
            <Field label="Container Number">
              <Input value={form.container_no} onChange={(e) => setForm({ ...form, container_no: e.target.value })} placeholder="Leave blank to hold all" />
            </Field>
            <Field label="Remarks" required>
              <TextArea rows={3} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Reason for hold" />
            </Field>
            <Button type="submit" disabled={saving} className="w-full">Create Hold</Button>
          </form>
        </Card>

        <Card className="col-span-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: "var(--line)" }}>
                {["Line", "Container", "Hold For", "Remarks", "Allowed"].map((h) => (
                  <th key={h} className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wide" style={{ color: "var(--slate)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0" style={{ borderColor: "var(--line)" }}>
                  <td className="px-4 py-3">{r.companies?.name}</td>
                  <td className="px-4 py-3 font-mono">{r.container_no || "ALL"}</td>
                  <td className="px-4 py-3">{r.hold_for}</td>
                  <td className="px-4 py-3 max-w-xs" style={{ color: "var(--slate)" }}>{r.remarks}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleAllow(r.id, r.is_allowed)}
                      className="px-2.5 py-1 rounded text-[11px] font-semibold font-mono"
                      style={{
                        background: r.is_allowed ? "#e6f3ec" : "#faeae6",
                        color: r.is_allowed ? "var(--ok)" : "var(--danger)",
                      }}
                    >
                      {r.is_allowed ? "ALLOWED" : "BLOCKED"}
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center" style={{ color: "var(--slate)" }}>No holds created yet.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

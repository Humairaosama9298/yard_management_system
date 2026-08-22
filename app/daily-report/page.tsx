"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader, Card, Field, Select, Input, Button, Badge } from "@/components/ui";

type Opt = { id: string; name: string };

export default function DailyReport() {
  const [lines, setLines] = useState<Opt[]>([]);
  const [lineId, setLineId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("companies").select("id, name").eq("type", "shipping_line").order("name");
      setLines(data ?? []);
    })();
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!lineId) return;
    setLoading(true);
    setGenerated(true);

    let query = supabase
      .from("gate_entries")
      .select(
        `eir_no, mode, status, truck_no, event_date,
         containers!inner(container_no, size, line_id),
         yards(name), terminals(name)`
      )
      .eq("containers.line_id", lineId)
      .order("event_date", { ascending: true });

    if (fromDate) query = query.gte("event_date", fromDate);
    if (toDate) query = query.lte("event_date", toDate + "T23:59:59");

    const { data } = await query;
    setRows(data ?? []);
    setLoading(false);
  }

  const lineName = lines.find((l) => l.id === lineId)?.name ?? "";
  const gateIn = rows.filter((r) => r.mode === "GATE_IN").length;
  const gateOut = rows.filter((r) => r.mode === "GATE_OUT").length;
  const damaged = rows.filter((r) => r.status === "DAMAGE").length;

  return (
    <div>
      <PageHeader eyebrow="Line Communication" title="Daily Report — For Shipping Line" subtitle="Generate the final movement report to send to a shipping line." />
      <div className="p-4 md:p-8 space-y-6">
        <Card className="p-5 no-print">
          <form onSubmit={handleGenerate} className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <Field label="Shipping Line" required>
              <Select value={lineId} onChange={(e) => setLineId(e.target.value)}>
                <option value="">Select line</option>
                {lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Select>
            </Field>
            <Field label="From Date">
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </Field>
            <Field label="To Date">
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </Field>
            <Button type="submit" disabled={loading}>{loading ? "Generating…" : "Generate Report"}</Button>
          </form>
        </Card>

        {generated && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5 no-print">
              <div />
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-sm font-medium rounded-md"
                style={{ background: "var(--ink)", color: "white" }}
              >
                Print / Send Report
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="font-display font-semibold text-[18px]">Daily Container Movement Report</div>
              <div className="text-[13px] mt-1" style={{ color: "var(--slate)" }}>
                {lineName} — {fromDate || "…"} to {toDate || "…"}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center rounded-md py-3" style={{ background: "#e6f3ec" }}>
                <div className="text-[20px] font-semibold" style={{ color: "var(--ok)" }}>{gateIn}</div>
                <div className="text-[11px] font-mono uppercase" style={{ color: "var(--slate)" }}>Gate-In</div>
              </div>
              <div className="text-center rounded-md py-3" style={{ background: "#fef3e2" }}>
                <div className="text-[20px] font-semibold" style={{ color: "var(--amber-deep)" }}>{gateOut}</div>
                <div className="text-[11px] font-mono uppercase" style={{ color: "var(--slate)" }}>Gate-Out</div>
              </div>
              <div className="text-center rounded-md py-3" style={{ background: "#faeae6" }}>
                <div className="text-[20px] font-semibold" style={{ color: "var(--danger)" }}>{damaged}</div>
                <div className="text-[11px] font-mono uppercase" style={{ color: "var(--slate)" }}>Damaged</div>
              </div>
            </div>

            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b" style={{ borderColor: "var(--line)" }}>
                  {["EIR No", "Mode", "Container", "Size", "Status", "Truck", "Yard", "Terminal", "Date"].map((h) => (
                    <th key={h} className="px-3 py-2 font-mono text-[11px] uppercase tracking-wide" style={{ color: "var(--slate)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b last:border-0" style={{ borderColor: "var(--line)" }}>
                    <td className="px-3 py-2 font-mono">{r.eir_no}</td>
                    <td className="px-3 py-2">{r.mode?.replace("_", " ")}</td>
                    <td className="px-3 py-2 font-mono font-medium">{r.containers?.container_no}</td>
                    <td className="px-3 py-2">{r.containers?.size}</td>
                    <td className="px-3 py-2"><Badge status={r.status} /></td>
                    <td className="px-3 py-2 font-mono">{r.truck_no || "—"}</td>
                    <td className="px-3 py-2">{r.yards?.name ?? "—"}</td>
                    <td className="px-3 py-2">{r.terminals?.name ?? "—"}</td>
                    <td className="px-3 py-2 whitespace-nowrap" style={{ color: "var(--slate)" }}>
                      {new Date(r.event_date).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={9} className="px-3 py-8 text-center" style={{ color: "var(--slate)" }}>No movement found for this line/date range.</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </Card>
        )}
      </div>
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          aside { display: none !important; }
        }
      `}</style>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ReceiptPage() {
  const params = useParams();
  const eir = decodeURIComponent(params.eir as string);
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("gate_entries")
        .select(
          `eir_no, mode, truck_no, status, remarks, event_date, arrival_date, chalan_no,
           containers(container_no, size, tare_weight, heavy, bl_no, status, present_status),
           yards(name), terminals(name), vessels(name, voyage),
           consignee:companies!gate_entries_consignee_id_fkey(name),
           transporter:companies!gate_entries_transporter_id_fkey(name),
           clearing_agent:companies!gate_entries_clearing_agent_id_fkey(name)`
        )
        .eq("eir_no", eir)
        .single();
      setEntry(data);
      setLoading(false);
    })();
  }, [eir]);

  if (loading) return <div className="p-10 text-center text-sm text-gray-500">Loading…</div>;
  if (!entry) return <div className="p-10 text-center text-sm text-gray-500">Receipt not found for {eir}.</div>;

  const row = (label: string, value: any) => (
    <tr>
      <td style={{ padding: "6px 10px", fontWeight: 600, width: "35%", border: "1px solid #ccc", background: "#f5f5f5" }}>{label}</td>
      <td style={{ padding: "6px 10px", border: "1px solid #ccc" }}>{value ?? "—"}</td>
    </tr>
  );

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", fontFamily: "Segoe UI, sans-serif", color: "#111" }}>
      <div className="no-print" style={{ textAlign: "right", marginBottom: 16 }}>
        <button
          onClick={() => window.print()}
          style={{ background: "#10192b", color: "white", padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer" }}
        >
          Print Receipt
        </button>
      </div>

      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, margin: 0 }}>Equipment Interchange Receipt (EIR)</h1>
        <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>{entry.mode?.replace("_", " ")}</div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <tbody>
          {row("EIR No", entry.eir_no)}
          {row("Date/Time", new Date(entry.event_date).toLocaleString())}
          {row("Container No", entry.containers?.container_no)}
          {row("Size", entry.containers?.size)}
          {row("Status", entry.status)}
          {row("Tare Weight", entry.containers?.tare_weight)}
          {row("Heavy", entry.containers?.heavy ? "Yes" : "No")}
          {row("B/L No", entry.containers?.bl_no)}
          {row("Vessel / Voyage", entry.vessels ? `${entry.vessels.name} / ${entry.vessels.voyage ?? "—"}` : "—")}
          {row("Yard", entry.yards?.name)}
          {row("Terminal", entry.terminals?.name)}
          {row("Consignee", entry.consignee?.name)}
          {row("Transporter", entry.transporter?.name)}
          {row("Clearing Agent", entry.clearing_agent?.name)}
          {row("Truck No", entry.truck_no)}
          {row("Chalan No", entry.chalan_no)}
          {row("Arrival Date", entry.arrival_date)}
          {row("Remarks / Present Status", entry.remarks || entry.containers?.present_status)}
        </tbody>
      </table>

      <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
        <div>Gate Staff Signature: ______________________</div>
        <div>Driver Signature: ______________________</div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
}

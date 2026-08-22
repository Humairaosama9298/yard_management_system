"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader, Card, StatTile } from "@/components/ui";

const SIZES = ["20GP", "40GP", "40HQ", "40FR", "20RF"];

export default function Reports() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("containers").select("size, status, current_state");
      setRows(data ?? []);
      setLoading(false);
    })();
  }, []);

  const stockBySize = SIZES.map((size) => {
    const inSize = rows.filter((r) => r.size === size);
    return {
      size,
      total: inSize.length,
      inYard: inSize.filter((r) => r.current_state === "IN_YARD").length,
      damaged: inSize.filter((r) => r.status === "DAMAGE").length,
      dispatched: inSize.filter((r) => r.current_state === "DISPATCHED").length,
    };
  });

  const totals = stockBySize.reduce(
    (acc, s) => ({
      total: acc.total + s.total,
      inYard: acc.inYard + s.inYard,
      damaged: acc.damaged + s.damaged,
      dispatched: acc.dispatched + s.dispatched,
    }),
    { total: 0, inYard: 0, damaged: 0, dispatched: 0 }
  );

  return (
    <div>
      <PageHeader eyebrow="Insights" title="Stock Reports" subtitle="Size-wise yard stock, damage and dispatch summary." />
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-4 gap-4">
          <StatTile label="Total Containers" value={totals.total} />
          <StatTile label="In Yard" value={totals.inYard} accent />
          <StatTile label="Dispatched" value={totals.dispatched} />
          <StatTile label="Damaged" value={totals.damaged} />
        </div>

        <Card>
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--line)" }}>
            <h3 className="font-display font-semibold text-[14px]">Stock by Size</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: "var(--line)" }}>
                {["Size", "Total", "In Yard", "Dispatched", "Damaged"].map((h) => (
                  <th key={h} className="px-5 py-2.5 font-mono text-[11px] uppercase tracking-wide" style={{ color: "var(--slate)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stockBySize.map((s) => (
                <tr key={s.size} className="border-b last:border-0" style={{ borderColor: "var(--line)" }}>
                  <td className="px-5 py-3 font-mono font-medium">{s.size}</td>
                  <td className="px-5 py-3">{s.total}</td>
                  <td className="px-5 py-3">{s.inYard}</td>
                  <td className="px-5 py-3">{s.dispatched}</td>
                  <td className="px-5 py-3" style={{ color: s.damaged > 0 ? "var(--danger)" : "var(--slate)" }}>{s.damaged}</td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center" style={{ color: "var(--slate)" }}>No stock data yet.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

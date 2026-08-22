"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader, Card, Input, Button, Badge } from "@/components/ui";
import { Search } from "lucide-react";

export default function Tracking() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setSearched(true);
    const { data } = await supabase
      .from("gate_entries")
      .select(
        "eir_no, mode, truck_no, status, remarks, event_date, containers(container_no, size), yards(name), terminals(name), vessels(name, voyage)"
      )
      .or(`eir_no.ilike.%${query}%`)
      .order("event_date", { ascending: false });

    let rows = data ?? [];
    if (rows.length === 0) {
      const { data: byContainer } = await supabase
        .from("gate_entries")
        .select(
          "eir_no, mode, truck_no, status, remarks, event_date, containers!inner(container_no, size), yards(name), terminals(name), vessels(name, voyage)"
        )
        .ilike("containers.container_no", `%${query}%`)
        .order("event_date", { ascending: false });
      rows = byContainer ?? [];
    }
    setResults(rows);
    setLoading(false);
  }

  return (
    <div>
      <PageHeader eyebrow="Search" title="Tracking" subtitle="Look up a container or EIR to view its full event history." />
      <div className="p-8 space-y-6">
        <Card className="p-5">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--slate)" }} />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Container No or EIR No — e.g. OOCU6160542"
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={loading}>{loading ? "Searching…" : "Search"}</Button>
          </form>
        </Card>

        <Card>
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--line)" }}>
            <h3 className="font-display font-semibold text-[14px]">Event Details</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: "var(--line)" }}>
                {["EIR No", "Mode", "Container", "Size", "Vessel/Voy", "Yard", "Terminal", "Status", "Truck", "Date"].map((h) => (
                  <th key={h} className="px-4 py-2.5 font-mono text-[11px] uppercase tracking-wide whitespace-nowrap" style={{ color: "var(--slate)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className="border-b last:border-0" style={{ borderColor: "var(--line)" }}>
                  <td className="px-4 py-3 font-mono text-[13px]" style={{ color: "var(--amber-deep)" }}>{r.eir_no}</td>
                  <td className="px-4 py-3">{r.mode?.replace("_", " ")}</td>
                  <td className="px-4 py-3 font-mono font-medium">{r.containers?.container_no}</td>
                  <td className="px-4 py-3">{r.containers?.size}</td>
                  <td className="px-4 py-3" style={{ color: "var(--slate)" }}>
                    {r.vessels ? `${r.vessels.name} / ${r.vessels.voyage ?? "—"}` : "—"}
                  </td>
                  <td className="px-4 py-3">{r.yards?.name ?? "—"}</td>
                  <td className="px-4 py-3">{r.terminals?.name ?? "—"}</td>
                  <td className="px-4 py-3"><Badge status={r.status} /></td>
                  <td className="px-4 py-3 font-mono">{r.truck_no || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--slate)" }}>
                    {new Date(r.event_date).toLocaleString()}
                  </td>
                </tr>
              ))}
              {!loading && searched && results.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-10 text-center" style={{ color: "var(--slate)" }}>No records found for "{query}".</td></tr>
              )}
              {!searched && (
                <tr><td colSpan={10} className="px-4 py-10 text-center" style={{ color: "var(--slate)" }}>Search a container or EIR number to see event history.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

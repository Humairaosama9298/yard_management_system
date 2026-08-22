"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader, Card, StatTile, Badge } from "@/components/ui";

type Container = {
  id: string;
  container_no: string;
  size: string;
  status: string;
  current_state: string;
  created_at: string;
};

export default function Dashboard() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("containers")
        .select("id, container_no, size, status, current_state, created_at")
        .order("created_at", { ascending: false })
        .limit(8);
      setContainers(data ?? []);
      setLoading(false);
    })();
  }, []);

  const inYard = containers.filter((c) => c.current_state === "IN_YARD").length;
  const damaged = containers.filter((c) => c.status === "DAMAGE").length;

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="Yard Dashboard"
        subtitle="Live snapshot of depot activity across gate, stock and survey."
      />
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-4 gap-4">
          <StatTile label="Containers Tracked" value={containers.length} />
          <StatTile label="Currently In-Yard" value={inYard} accent />
          <StatTile label="Damaged Units" value={damaged} />
          <StatTile label="Active Yards" value={1} />
        </div>

        <Card>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--line)" }}>
            <h2 className="font-display font-semibold text-[15px]">Recent Container Activity</h2>
            <a href="/tracking" className="text-[13px] font-medium" style={{ color: "var(--amber-deep)" }}>
              View all →
            </a>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: "var(--line)" }}>
                {["Container No", "Size", "Condition", "State", "Added"].map((h) => (
                  <th key={h} className="px-5 py-2.5 font-mono text-[11px] uppercase tracking-wide" style={{ color: "var(--slate)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm" style={{ color: "var(--slate)" }}>
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && containers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm" style={{ color: "var(--slate)" }}>
                    No containers yet — start with Gate-In.
                  </td>
                </tr>
              )}
              {containers.map((c) => (
                <tr key={c.id} className="border-b last:border-0" style={{ borderColor: "var(--line)" }}>
                  <td className="px-5 py-3 font-mono font-medium">{c.container_no}</td>
                  <td className="px-5 py-3">{c.size}</td>
                  <td className="px-5 py-3">
                    <Badge status={c.status} />
                  </td>
                  <td className="px-5 py-3">
                    <Badge status={c.current_state} />
                  </td>
                  <td className="px-5 py-3" style={{ color: "var(--slate)" }}>
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

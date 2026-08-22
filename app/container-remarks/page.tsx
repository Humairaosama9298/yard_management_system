"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader, Card, Field, Input, Select, TextArea, Button, Badge } from "@/components/ui";
import { Search } from "lucide-react";

export default function ContainerRemarks() {
  const [query, setQuery] = useState("");
  const [container, setContainer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ status: "SOUND", present_status: "" });

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setMessage("");
    const { data } = await supabase
      .from("containers")
      .select("id, container_no, size, status, present_status, current_state")
      .ilike("container_no", `%${query}%`)
      .limit(1)
      .maybeSingle();
    setContainer(data);
    if (data) setForm({ status: data.status ?? "SOUND", present_status: data.present_status ?? "" });
    setLoading(false);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!container) return;
    setSaving(true);
    const { error } = await supabase
      .from("containers")
      .update({ status: form.status, present_status: form.present_status })
      .eq("id", container.id);

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("Remarks updated successfully.");
      setContainer({ ...container, status: form.status, present_status: form.present_status });
    }
    setSaving(false);
  }

  return (
    <div>
      <PageHeader eyebrow="Container Update" title="Change Container Remarks" subtitle="Search a container and update its condition/status remarks." />
      <div className="p-4 md:p-8 space-y-6">
        <Card className="p-5">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--slate)" }} />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Container No — e.g. OOCU6160542" className="pl-9" />
            </div>
            <Button type="submit" disabled={loading}>{loading ? "Searching…" : "Search"}</Button>
          </form>
        </Card>

        {container && (
          <Card className="p-6 max-w-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-mono font-semibold text-[15px]">{container.container_no}</div>
                <div className="text-[12px]" style={{ color: "var(--slate)" }}>{container.size}</div>
              </div>
              <Badge status={container.status} />
            </div>

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

            <form onSubmit={handleUpdate} className="space-y-4">
              <Field label="Status">
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="SOUND">SOUND</option>
                  <option value="DAMAGE">DAMAGE</option>
                </Select>
              </Field>
              <Field label="Present Status / Remarks">
                <TextArea rows={3} value={form.present_status} onChange={(e) => setForm({ ...form, present_status: e.target.value })} />
              </Field>
              <Button type="submit" disabled={saving}>{saving ? "Updating…" : "Update Remarks"}</Button>
            </form>
          </Card>
        )}

        {!container && query && !loading && (
          <div className="text-sm" style={{ color: "var(--slate)" }}>No container found for "{query}".</div>
        )}
      </div>
    </div>
  );
}

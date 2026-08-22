"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader, Card, Field, Input, Select, Button } from "@/components/ui";

type Company = { id: string; name: string; type: string; contact: string | null };
type Simple = { id: string; name: string };

const COMPANY_TYPES = [
  { value: "shipping_line", label: "Shipping Line" },
  { value: "consignee", label: "Consignee" },
  { value: "shipper", label: "Shipper" },
  { value: "transporter", label: "Transporter" },
  { value: "clearing_agent", label: "Clearing Agent" },
];

export default function Masters() {
  const [tab, setTab] = useState<"companies" | "terminals" | "yards">("companies");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [terminals, setTerminals] = useState<Simple[]>([]);
  const [yards, setYards] = useState<Simple[]>([]);

  const [companyForm, setCompanyForm] = useState({ name: "", type: "shipping_line", contact: "" });
  const [terminalName, setTerminalName] = useState("");
  const [yardName, setYardName] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadAll() {
    const [c, t, y] = await Promise.all([
      supabase.from("companies").select("id, name, type, contact").order("name"),
      supabase.from("terminals").select("id, name").order("name"),
      supabase.from("yards").select("id, name").order("name"),
    ]);
    setCompanies(c.data ?? []);
    setTerminals(t.data ?? []);
    setYards(y.data ?? []);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function addCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!companyForm.name) return;
    setSaving(true);
    await supabase.from("companies").insert(companyForm);
    setCompanyForm({ name: "", type: "shipping_line", contact: "" });
    await loadAll();
    setSaving(false);
  }

  async function addTerminal(e: React.FormEvent) {
    e.preventDefault();
    if (!terminalName) return;
    setSaving(true);
    await supabase.from("terminals").insert({ name: terminalName });
    setTerminalName("");
    await loadAll();
    setSaving(false);
  }

  async function addYard(e: React.FormEvent) {
    e.preventDefault();
    if (!yardName) return;
    setSaving(true);
    await supabase.from("yards").insert({ name: yardName });
    setYardName("");
    await loadAll();
    setSaving(false);
  }

  const tabs = [
    { key: "companies", label: `Companies (${companies.length})` },
    { key: "terminals", label: `Terminals (${terminals.length})` },
    { key: "yards", label: `Yards (${yards.length})` },
  ] as const;

  return (
    <div>
      <PageHeader eyebrow="Setup" title="Masters" subtitle="Shipping lines, consignees, transporters, terminals and yards." />
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex gap-1 border-b" style={{ borderColor: "var(--line)" }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-2.5 text-sm font-medium -mb-px border-b-2"
              style={{
                borderColor: tab === t.key ? "var(--amber)" : "transparent",
                color: tab === t.key ? "var(--ink)" : "var(--slate)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "companies" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-5 h-fit">
              <h3 className="font-display font-semibold text-[14px] mb-4">Add Company</h3>
              <form onSubmit={addCompany} className="space-y-3">
                <Field label="Name" required>
                  <Input value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} placeholder="e.g. OOCL" />
                </Field>
                <Field label="Type" required>
                  <Select value={companyForm.type} onChange={(e) => setCompanyForm({ ...companyForm, type: e.target.value })}>
                    {COMPANY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Contact">
                  <Input value={companyForm.contact} onChange={(e) => setCompanyForm({ ...companyForm, contact: e.target.value })} placeholder="Phone / email" />
                </Field>
                <Button type="submit" disabled={saving} className="w-full">Add Company</Button>
              </form>
            </Card>
            <Card className="col-span-2">
              <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b" style={{ borderColor: "var(--line)" }}>
                    <th className="px-5 py-2.5 font-mono text-[11px] uppercase tracking-wide" style={{ color: "var(--slate)" }}>Name</th>
                    <th className="px-5 py-2.5 font-mono text-[11px] uppercase tracking-wide" style={{ color: "var(--slate)" }}>Type</th>
                    <th className="px-5 py-2.5 font-mono text-[11px] uppercase tracking-wide" style={{ color: "var(--slate)" }}>Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c) => (
                    <tr key={c.id} className="border-b last:border-0" style={{ borderColor: "var(--line)" }}>
                      <td className="px-5 py-3 font-medium">{c.name}</td>
                      <td className="px-5 py-3" style={{ color: "var(--slate)" }}>{COMPANY_TYPES.find((t) => t.value === c.type)?.label}</td>
                      <td className="px-5 py-3" style={{ color: "var(--slate)" }}>{c.contact || "—"}</td>
                    </tr>
                  ))}
                  {companies.length === 0 && (
                    <tr><td colSpan={3} className="px-5 py-8 text-center" style={{ color: "var(--slate)" }}>No companies added yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            </Card>
          </div>
        )}

        {tab === "terminals" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-5 h-fit">
              <h3 className="font-display font-semibold text-[14px] mb-4">Add Terminal</h3>
              <form onSubmit={addTerminal} className="space-y-3">
                <Field label="Name" required>
                  <Input value={terminalName} onChange={(e) => setTerminalName(e.target.value)} placeholder="e.g. SAPT" />
                </Field>
                <Button type="submit" disabled={saving} className="w-full">Add Terminal</Button>
              </form>
            </Card>
            <Card className="col-span-2">
              <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <tbody>
                  {terminals.map((t) => (
                    <tr key={t.id} className="border-b last:border-0" style={{ borderColor: "var(--line)" }}>
                      <td className="px-5 py-3 font-medium">{t.name}</td>
                    </tr>
                  ))}
                  {terminals.length === 0 && (
                    <tr><td className="px-5 py-8 text-center" style={{ color: "var(--slate)" }}>No terminals added yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            </Card>
          </div>
        )}

        {tab === "yards" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-5 h-fit">
              <h3 className="font-display font-semibold text-[14px] mb-4">Add Yard</h3>
              <form onSubmit={addYard} className="space-y-3">
                <Field label="Name" required>
                  <Input value={yardName} onChange={(e) => setYardName(e.target.value)} placeholder="e.g. UOSL Depot KHI" />
                </Field>
                <Button type="submit" disabled={saving} className="w-full">Add Yard</Button>
              </form>
            </Card>
            <Card className="col-span-2">
              <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <tbody>
                  {yards.map((y) => (
                    <tr key={y.id} className="border-b last:border-0" style={{ borderColor: "var(--line)" }}>
                      <td className="px-5 py-3 font-medium">{y.name}</td>
                    </tr>
                  ))}
                  {yards.length === 0 && (
                    <tr><td className="px-5 py-8 text-center" style={{ color: "var(--slate)" }}>No yards added yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

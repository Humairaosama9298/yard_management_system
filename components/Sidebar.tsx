"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  Search,
  Grid3x3,
  ClipboardList,
  ShieldAlert,
  Building2,
  BarChart3,
  Anchor,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/gate-in", label: "Gate-In", icon: LogIn },
  { href: "/gate-out", label: "Gate-Out", icon: LogOut },
  { href: "/tracking", label: "Tracking", icon: Search },
  { href: "/yard", label: "Yard Slots", icon: Grid3x3 },
  { href: "/bookings", label: "Loading Program", icon: ClipboardList },
  { href: "/block-container", label: "Block Container", icon: ShieldAlert },
  { href: "/masters", label: "Masters", icon: Building2 },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-64 shrink-0 flex flex-col"
      style={{ background: "var(--ink)", color: "var(--mist)" }}
    >
      <div className="px-6 py-6 flex items-center gap-2 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <Anchor size={22} style={{ color: "var(--amber)" }} />
        <div>
          <div className="font-display font-semibold text-[17px] tracking-tight leading-none">Yard Control</div>
          <div className="text-[11px] mt-1 opacity-50 font-mono tracking-wide">KARACHI OPS</div>
        </div>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors"
              style={{
                background: active ? "var(--amber)" : "transparent",
                color: active ? "var(--ink)" : "var(--mist)",
                fontWeight: active ? 600 : 500,
              }}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-6 py-4 text-[11px] opacity-40 font-mono border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        v1.0 — Off-Dock Depot
      </div>
    </aside>
  );
}

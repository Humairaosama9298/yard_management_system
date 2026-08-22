"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
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
  PenSquare,
  FileText,
  LogOut as SignOutIcon,
  Menu,
  X,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/gate-in", label: "Gate-In", icon: LogIn },
  { href: "/gate-out", label: "Gate-Out", icon: LogOut },
  { href: "/tracking", label: "Tracking", icon: Search },
  { href: "/container-remarks", label: "Change Remarks", icon: PenSquare },
  { href: "/yard", label: "Yard Slots", icon: Grid3x3 },
  { href: "/bookings", label: "Loading Program", icon: ClipboardList },
  { href: "/block-container", label: "Block Container", icon: ShieldAlert },
  { href: "/masters", label: "Masters", icon: Building2 },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/daily-report", label: "Daily Report (Line)", icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userLabel, setUserLabel] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata as any;
      setUserLabel(meta?.full_name || data.user?.email || "");
    });
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-40"
        style={{ background: "var(--ink)", color: "var(--mist)" }}
      >
        <div className="flex items-center gap-2">
          <Anchor size={18} style={{ color: "var(--amber)" }} />
          <span className="font-display font-semibold text-[15px]">Yard Control</span>
        </div>
        <button onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`w-64 shrink-0 flex flex-col fixed md:static inset-y-0 left-0 z-50 transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ background: "var(--ink)", color: "var(--mist)" }}
      >
        <div className="px-6 py-6 flex items-center justify-between gap-2 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2">
            <Anchor size={22} style={{ color: "var(--amber)" }} />
            <div>
              <div className="font-display font-semibold text-[17px] tracking-tight leading-none">Yard Control</div>
              <div className="text-[11px] mt-1 opacity-50 font-mono tracking-wide">KARACHI OPS</div>
            </div>
          </div>
          <button className="md:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
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
        <div className="px-4 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {userLabel && (
            <div className="px-2 mb-2 text-[12px] font-medium truncate" style={{ color: "var(--mist)" }}>
              {userLabel}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-[13px] font-medium transition-colors"
            style={{ color: "var(--mist)", opacity: 0.75 }}
          >
            <SignOutIcon size={15} />
            Log Out
          </button>
          <div className="text-[11px] opacity-40 font-mono tracking-wide mt-1 px-2">v1.0 — Off-Dock Depot</div>
        </div>
      </aside>
    </>
  );
}

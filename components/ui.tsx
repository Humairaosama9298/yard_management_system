"use client";

import React from "react";

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  action,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 px-4 md:px-8 pt-6 md:pt-8 pb-5 md:pb-6 border-b" style={{ borderColor: "var(--line)" }}>
      <div>
        {eyebrow && (
          <div className="font-mono text-[11px] tracking-widest uppercase mb-1" style={{ color: "var(--amber-deep)" }}>
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-[20px] md:text-[26px] font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-1" style={{ color: "var(--slate)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg bg-white ${className}`}
      style={{ border: "1px solid var(--line)" }}
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[12px] font-medium mb-1.5" style={{ color: "var(--steel)" }}>
        {label} {required && <span style={{ color: "var(--danger)" }}>*</span>}
      </span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full px-3 py-2 text-sm rounded-md border outline-none transition-colors focus:ring-2";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`${inputClass} ${props.className ?? ""}`}
      style={{ borderColor: "var(--line)", ...props.style }}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`${inputClass} bg-white ${props.className ?? ""}`}
      style={{ borderColor: "var(--line)", ...props.style }}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${inputClass} ${props.className ?? ""}`}
      style={{ borderColor: "var(--line)", ...props.style }}
    />
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: "var(--ink)", color: "white" },
    secondary: { background: "white", color: "var(--ink)", border: "1px solid var(--line)" },
    danger: { background: "var(--danger)", color: "white" },
  };
  return (
    <button
      {...props}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-opacity hover:opacity-90 disabled:opacity-50 ${className}`}
      style={styles[variant]}
    >
      {children}
    </button>
  );
}

export function Badge({ status }: { status: string }) {
  const map: Record<string, React.CSSProperties> = {
    SOUND: { background: "#e6f3ec", color: "var(--ok)" },
    DAMAGE: { background: "#faeae6", color: "var(--danger)" },
    IN_YARD: { background: "#e6f3ec", color: "var(--ok)" },
    DISPATCHED: { background: "#eef1f6", color: "var(--slate)" },
    IN_TRANSIT: { background: "#fef3e2", color: "var(--amber-deep)" },
  };
  return (
    <span
      className="px-2 py-0.5 rounded text-[11px] font-semibold font-mono tracking-wide"
      style={map[status] ?? { background: "#eef1f6", color: "var(--slate)" }}
    >
      {status}
    </span>
  );
}

export function StatTile({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-white px-5 py-4" style={{ border: "1px solid var(--line)" }}>
      <div className="text-[11px] font-mono uppercase tracking-wide" style={{ color: "var(--slate)" }}>
        {label}
      </div>
      <div
        className="font-display text-[28px] font-semibold mt-1"
        style={{ color: accent ? "var(--amber-deep)" : "var(--ink)" }}
      >
        {value}
      </div>
    </div>
  );
}

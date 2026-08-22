"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Field, Input, Button } from "@/components/ui";
import { Anchor } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--paper)" }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3" style={{ background: "var(--ink)" }}>
            <Anchor size={22} style={{ color: "var(--amber)" }} />
          </div>
          <h1 className="font-display text-[20px] font-semibold" style={{ color: "var(--ink)" }}>Yard Control</h1>
          <p className="text-[12px] font-mono mt-1" style={{ color: "var(--slate)" }}>KARACHI OPS</p>
        </div>

        <div className="rounded-lg bg-white p-6" style={{ border: "1px solid var(--line)" }}>
          <div className="flex gap-1 mb-5 rounded-md p-1" style={{ background: "var(--mist)" }}>
            <button
              onClick={() => setMode("signin")}
              className="flex-1 py-1.5 text-sm font-medium rounded"
              style={{ background: mode === "signin" ? "white" : "transparent", color: "var(--ink)" }}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("signup")}
              className="flex-1 py-1.5 text-sm font-medium rounded"
              style={{ background: mode === "signup" ? "white" : "transparent", color: "var(--ink)" }}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-md text-[13px]" style={{ background: "#faeae6", color: "var(--danger)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <Field label="Full Name" required>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" required />
              </Field>
            )}
            <Field label="Email" required>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
            </Field>
            <Field label="Password" required>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </Field>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

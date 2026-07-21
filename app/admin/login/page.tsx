"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="container" style={{ padding: "60px 24px", maxWidth: 420 }}>
      <p className="eyebrow">Reviewer access</p>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.7rem", margin: "8px 0 20px" }}>
        Log in
      </h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div style={{ marginTop: 22 }}>
          <button type="submit" disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
          </button>
        </div>
        {error && (
          <p className="help" style={{ color: "var(--tier-disputed)" }}>
            {error}
          </p>
        )}
      </form>
      <p className="help" style={{ marginTop: 20 }}>
        Reviewer accounts are created manually in Supabase — see the README
        for setup steps. This page doesn&rsquo;t offer self-signup on
        purpose.
      </p>
    </main>
  );
}

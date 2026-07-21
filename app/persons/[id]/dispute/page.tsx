"use client";

import { useState } from "react";
import { use } from "react";
import { createClient } from "@/lib/supabase-client";

export default function DisputePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [reason, setReason] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    const supabase = createClient();
    const { error } = await supabase.from("disputes").insert({
      person_id: id,
      reason,
      submitted_contact: contact || null,
    });
    setStatus(error ? "error" : "done");
  }

  if (status === "done") {
    return (
      <main className="container" style={{ padding: "40px 24px", maxWidth: 600 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem" }}>
          Dispute submitted
        </h1>
        <p style={{ color: "var(--ink-soft)" }}>
          A reviewer will look into this identification. If it&rsquo;s upheld,
          the profile will be flagged as disputed and, if warranted,
          corrected — with a public correction notice, not a silent edit.
        </p>
      </main>
    );
  }

  return (
    <main className="container" style={{ padding: "40px 24px", maxWidth: 600 }}>
      <p className="eyebrow">Correction request</p>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", margin: "8px 0 6px" }}>
        Dispute this identification
      </h1>
      <p style={{ color: "var(--ink-soft)" }}>
        Tell us specifically what&rsquo;s wrong — wrong name, wrong incident,
        outdated information, etc. A senior reviewer will look at this before
        anything changes on the public profile.
      </p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="reason">What&rsquo;s incorrect, and why?</label>
        <textarea
          id="reason"
          required
          minLength={10}
          rows={5}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Be specific — include any evidence or source that supports the correction."
        />

        <label htmlFor="contact">Your contact info (optional, private)</label>
        <input
          id="contact"
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Email, in case a reviewer has follow-up questions"
        />
        <p className="help">Never shown publicly.</p>

        <div style={{ marginTop: 22 }}>
          <button type="submit" disabled={status === "submitting"}>
            {status === "submitting" ? "Submitting…" : "Submit dispute"}
          </button>
        </div>
        {status === "error" && (
          <p className="help" style={{ color: "var(--tier-disputed)" }}>
            Something went wrong. Please try again.
          </p>
        )}
      </form>
    </main>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resolveDispute } from "@/app/admin/actions";

export default function DisputeResolver({
  disputeId,
  personId,
}: {
  disputeId: string;
  personId: string;
}) {
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function resolve(outcome: "upheld" | "rejected") {
    startTransition(async () => {
      await resolveDispute({
        disputeId,
        personId,
        outcome,
        resolutionNotes: notes,
        clearDisputeFlag: outcome === "rejected",
      });
      router.push("/admin");
    });
  }

  return (
    <div style={{ marginTop: 20 }}>
      <label htmlFor="resolution">Resolution notes (goes on the public record if upheld)</label>
      <textarea id="resolution" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
        <button disabled={pending} onClick={() => resolve("upheld")}>
          Uphold — flag as disputed
        </button>
        <button className="secondary" disabled={pending} onClick={() => resolve("rejected")}>
          Reject dispute — no change
        </button>
      </div>
      <p className="help">
        &ldquo;Uphold&rdquo; flags the profile publicly as disputed. It
        doesn&rsquo;t delete the entry — go edit the person directly from the
        incident page if the name or tier needs to change.
      </p>
    </div>
  );
}

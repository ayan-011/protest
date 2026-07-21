"use client";

import { useState, useTransition } from "react";
import { publishIncident, rejectIncident } from "@/app/admin/actions";

export default function ReviewControls({
  incidentId,
  currentStatus,
}: {
  incidentId: string;
  currentStatus: string;
}) {
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  return (
    <div>
      <p className="eyebrow">Review decision</p>
      <label htmlFor="notes">Reviewer notes</label>
      <textarea
        id="notes"
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Why this decision — visible only in the internal review log."
      />
      <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await publishIncident(incidentId, notes);
              setMessage("Published.");
            })
          }
        >
          Publish incident
        </button>
        <button
          className="secondary"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              if (!notes) {
                setMessage("Add a note explaining the rejection first.");
                return;
              }
              await rejectIncident(incidentId, notes);
              setMessage("Removed from queue.");
            })
          }
        >
          Reject / remove
        </button>
      </div>
      <p className="help">Current status: {currentStatus.replace("_", " ")}</p>
      {message && <p className="help">{message}</p>}
    </div>
  );
}

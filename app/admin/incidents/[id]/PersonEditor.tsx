"use client";

import { useState, useTransition } from "react";
import { upsertPerson } from "@/app/admin/actions";
import { maxAllowedTier, SourceType } from "@/lib/verification";
import TierTag from "@/components/TierTag";

interface SourceInput {
  source_type: SourceType;
  url: string;
}

export default function PersonEditor({
  incidentId,
  person,
  role,
  existingSources,
}: {
  incidentId: string;
  person: any;
  role: "subject" | "witness" | "other";
  existingSources: any[];
}) {
  const [displayName, setDisplayName] = useState(person?.display_name ?? "");
  const [badgeNumber, setBadgeNumber] = useState(person?.badge_number ?? "");
  const [department, setDepartment] = useState(person?.department ?? "");
  const [photoUrl, setPhotoUrl] = useState(person?.photo_url ?? "");
  const [sources, setSources] = useState<SourceInput[]>(
    existingSources.map((s) => ({ source_type: s.source_type, url: s.url }))
  );
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const previewTier = maxAllowedTier(sources.filter((s) => s.url), displayName.trim().length > 0);

  function updateSource(i: number, patch: Partial<SourceInput>) {
    setSources((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function addSource() {
    setSources((prev) => [...prev, { source_type: "news_article", url: "" }]);
  }

  function removeSource(i: number) {
    setSources((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await upsertPerson({
          incidentId,
          personId: person?.id,
          displayName,
          badgeNumber,
          department,
          photoUrl,
          role,
          sources: sources.filter((s) => s.url.trim().length > 0),
        });
        setMessage("Saved.");
      } catch (err: any) {
        setMessage(err.message ?? "Failed to save.");
      }
    });
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label>Name (leave blank to keep unidentified)</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div>
          <label>Badge number</label>
          <input value={badgeNumber} onChange={(e) => setBadgeNumber(e.target.value)} />
        </div>
        <div>
          <label>Department</label>
          <input value={department} onChange={(e) => setDepartment(e.target.value)} />
        </div>
        <div>
          <label>Photo URL</label>
          <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="Still from footage, uploaded to storage" />
        </div>
      </div>

      <label style={{ marginTop: 18 }}>Sources</label>
      {sources.map((s, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "170px 1fr auto", gap: 8, marginBottom: 8 }}>
          <select
            value={s.source_type}
            onChange={(e) => updateSource(i, { source_type: e.target.value as SourceType })}
          >
            <option value="court_filing">Court filing</option>
            <option value="official_record">Official record</option>
            <option value="department_statement">Department statement</option>
            <option value="news_article">News article</option>
            <option value="other">Other</option>
          </select>
          <input
            value={s.url}
            onChange={(e) => updateSource(i, { url: e.target.value })}
            placeholder="https://…"
          />
          <button type="button" className="secondary" onClick={() => removeSource(i)}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" className="secondary" onClick={addSource}>
        + Add source
      </button>

      <p className="help" style={{ marginTop: 12 }}>
        Resulting tier based on sources above: <TierTag tier={previewTier} />
      </p>

      <div style={{ marginTop: 14 }}>
        <button onClick={handleSave} disabled={pending}>
          {pending ? "Saving…" : person ? "Update person" : "Add person to case"}
        </button>
      </div>
      {message && <p className="help">{message}</p>}
    </div>
  );
}

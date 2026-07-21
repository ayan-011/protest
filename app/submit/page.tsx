"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";

export default function SubmitPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateOccurred, setDateOccurred] = useState("");
  const [locationText, setLocationText] = useState("");
  const [department, setDepartment] = useState("");
  const [originalSourceUrl, setOriginalSourceUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [contactEmail, setContactEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setErrorMsg("Please attach a video file.");
      return;
    }
    setStatus("submitting");
    setErrorMsg("");

    const supabase = createClient();

    try {
      // 1. Record the (private) submitter contact, if given.
      let submitterId: string | null = null;
      if (contactEmail) {
        const { data: submitter, error: submitterErr } = await supabase
          .from("submitters")
          .insert({ contact_email: contactEmail })
          .select("id")
          .single();
        if (submitterErr) throw submitterErr;
        submitterId = submitter.id;
      }

      // 2. Create the incident, unreviewed by default (enforced by RLS).
      const { data: incident, error: incidentErr } = await supabase
        .from("incidents")
        .insert({
          title,
          description,
          date_occurred: dateOccurred || null,
          location_text: locationText || null,
          department: department || null,
          status: "unreviewed",
        })
        .select("id")
        .single();
      if (incidentErr) throw incidentErr;

      // 3. Upload the video file to storage.
      const ext = file.name.split(".").pop();
      const path = `${incident.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("videos").upload(path, file);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("videos").getPublicUrl(path);

      // 4. Record the video row.
      const { error: videoErr } = await supabase.from("videos").insert({
        incident_id: incident.id,
        file_url: urlData.publicUrl,
        submitted_by: submitterId,
        original_source_url: originalSourceUrl || null,
      });
      if (videoErr) throw videoErr;

      setStatus("done");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message ?? "Something went wrong.");
    }
  }

  if (status === "done") {
    return (
      <main className="container" style={{ padding: "40px 24px", maxWidth: 620 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem" }}>
          Submission received
        </h1>
        <p style={{ color: "var(--ink-soft)" }}>
          Thank you. This is now in the review queue and is <strong>not</strong>{" "}
          public yet. A reviewer will check the footage, look for existing
          sources on anyone involved, and either publish it or follow up if
          more context is needed.
        </p>
      </main>
    );
  }

  return (
    <main className="container" style={{ padding: "40px 24px", maxWidth: 620 }}>
      <p className="eyebrow">Submit footage</p>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", margin: "8px 0 6px" }}>
        Add to the archive
      </h1>
      <p style={{ color: "var(--ink-soft)" }}>
        Nothing you submit goes public automatically. A reviewer checks every
        submission — see{" "}
        <a href="/methodology">how we verify identifications</a> — before
        anything is published.
      </p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="title">Short title</label>
        <input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />

        <label htmlFor="description">What happened?</label>
        <textarea
          id="description"
          required
          minLength={20}
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the incident as you understand it. Stick to what's shown or verifiable — the reviewer will check this against the footage."
        />

        <label htmlFor="date">Date it occurred (if known)</label>
        <input id="date" type="date" value={dateOccurred} onChange={(e) => setDateOccurred(e.target.value)} />

        <label htmlFor="location">Location</label>
        <input
          id="location"
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
          placeholder="City, intersection, venue…"
        />

        <label htmlFor="department">Department (if known)</label>
        <input
          id="department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="e.g. Springfield Police Department"
        />

        <label htmlFor="source">Original source URL (if reposting)</label>
        <input
          id="source"
          type="url"
          value={originalSourceUrl}
          onChange={(e) => setOriginalSourceUrl(e.target.value)}
          placeholder="Link to where this was first posted, if applicable"
        />
        <p className="help">
          Helps reviewers confirm this isn&rsquo;t recycled footage from an
          unrelated event.
        </p>

        <label htmlFor="file">Video file</label>
        <input
          id="file"
          type="file"
          accept="video/*"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        <label htmlFor="contact">Your email (optional, private)</label>
        <input
          id="contact"
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="In case a reviewer needs more context"
        />
        <p className="help">Never published. Only visible to reviewers.</p>

        <div style={{ marginTop: 22 }}>
          <button type="submit" disabled={status === "submitting"}>
            {status === "submitting" ? "Submitting…" : "Submit for review"}
          </button>
        </div>
        {status === "error" && (
          <p className="help" style={{ color: "var(--tier-disputed)" }}>
            {errorMsg}
          </p>
        )}
      </form>
    </main>
  );
}

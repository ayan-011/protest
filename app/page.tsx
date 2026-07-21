import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import TierTag from "@/components/TierTag";

export const revalidate = 0;

export default async function HomePage() {
  const supabase = await createClient();
  const { data: incidents } = await supabase
    .from("incidents")
    .select("id, title, description, date_occurred, department, status, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <main>
      <section style={{ borderBottom: "1px solid var(--rule-strong)", background: "var(--paper-raised)" }}>
        <div className="container" style={{ padding: "64px 24px 56px" }}>
          <p className="eyebrow">A public, sourced record</p>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2.6rem",
              lineHeight: 1.1,
              maxWidth: "16ch",
              margin: "14px 0 18px",
            }}
          >
            Every entry here is tiered by what we can prove.
          </h1>
          <p style={{ maxWidth: "60ch", color: "var(--ink-soft)", fontSize: "1.05rem" }}>
            This archive documents incidents of police conduct from submitted
            video. We don&rsquo;t guess at identities. Every name on this site
            is labeled with how well-sourced it is —{" "}
            <TierTag tier="unidentified" /> through <TierTag tier="sourced" /> —
            and linked to the record it came from.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
            <Link href="/incidents" className="btn">
              Browse the archive
            </Link>
            <Link href="/submit" className="btn secondary">
              Submit footage
            </Link>
          </div>
        </div>
      </section>

      <div className="container" style={{ padding: "48px 24px" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", marginBottom: 18 }}>
          Recently published
        </h2>

        {!incidents || incidents.length === 0 ? (
          <p style={{ color: "var(--ink-soft)" }}>
            No incidents have been published yet. Entries appear here once a
            reviewer has verified the submission — see{" "}
            <Link href="/methodology">Verification Standards</Link>.
          </p>
        ) : (
          incidents.map((incident) => (
            <div key={incident.id} className="entry">
              <span className="case-id">
                CASE {incident.id.slice(0, 8).toUpperCase()}
                {incident.date_occurred ? ` · ${incident.date_occurred}` : ""}
              </span>
              <h3 className="entry-title">
                <Link href={`/incidents/${incident.id}`}>{incident.title}</Link>
              </h3>
              <p style={{ color: "var(--ink-soft)" }}>
                {incident.description.slice(0, 220)}
                {incident.description.length > 220 ? "…" : ""}
              </p>
              <div className="entry-meta">
                {incident.department && <span>{incident.department}</span>}
                <Link href={`/incidents/${incident.id}`}>View case →</Link>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

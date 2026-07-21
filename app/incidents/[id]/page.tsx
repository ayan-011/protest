import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import TierTag from "@/components/TierTag";

export const revalidate = 0;

export default async function IncidentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: incident } = await supabase
    .from("incidents")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (!incident) notFound();

  const { data: videos } = await supabase
    .from("videos")
    .select("id, file_url, original_source_url, submitted_at")
    .eq("incident_id", id);

  const { data: incidentPersons } = await supabase
    .from("incident_persons")
    .select("role, persons(id, display_name, confidence_tier, is_disputed, photo_url)")
    .eq("incident_id", id);

  return (
    <main className="container" style={{ padding: "40px 24px", maxWidth: 780 }}>
      <span className="case-id">
        CASE {incident.id.slice(0, 8).toUpperCase()}
        {incident.date_occurred ? ` · FILED ${incident.date_occurred}` : ""}
      </span>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", margin: "10px 0 6px" }}>
        {incident.title}
      </h1>
      {incident.department && (
        <p className="eyebrow" style={{ marginBottom: 20 }}>
          {incident.department}
          {incident.location_text ? ` · ${incident.location_text}` : ""}
        </p>
      )}

      <p style={{ fontSize: "1.05rem" }}>{incident.description}</p>

      {videos && videos.length > 0 && (
        <>
          <hr className="hairline" />
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", marginBottom: 12 }}>
            Footage
          </h2>
          {videos.map((v) => (
            <div key={v.id} style={{ marginBottom: 16 }}>
              <video src={v.file_url} controls style={{ width: "100%", borderRadius: 2, border: "1px solid var(--rule)" }} />
              {v.original_source_url && (
                <p className="help">
                  Original source:{" "}
                  <a href={v.original_source_url} target="_blank" rel="noreferrer">
                    {v.original_source_url}
                  </a>
                </p>
              )}
            </div>
          ))}
        </>
      )}

      {incidentPersons && incidentPersons.length > 0 && (
        <>
          <hr className="hairline" />
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", marginBottom: 12 }}>
            People named in this case
          </h2>
          {incidentPersons.map((ip: any) => (
            <div key={ip.persons.id} className="entry">
              {ip.persons.is_disputed && (
                <div className="disputed-banner">
                  This identification is currently disputed and under review.
                </div>
              )}
              <TierTag tier={ip.persons.confidence_tier} />
              <h3 className="entry-title">
                <Link href={`/persons/${ip.persons.id}`}>
                  {ip.persons.display_name ?? "Unidentified individual"}
                </Link>
              </h3>
              <div className="entry-meta">
                <span style={{ textTransform: "capitalize" }}>{ip.role}</span>
                <Link href={`/persons/${ip.persons.id}`}>View profile & sources →</Link>
              </div>
            </div>
          ))}
        </>
      )}
    </main>
  );
}

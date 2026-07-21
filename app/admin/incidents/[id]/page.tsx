import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import TierTag from "@/components/TierTag";
import ReviewControls from "./ReviewControls";
import PersonEditor from "./PersonEditor";

export const revalidate = 0;

export default async function AdminIncidentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: incident } = await supabase.from("incidents").select("*").eq("id", id).single();
  if (!incident) notFound();

  const { data: videos } = await supabase.from("videos").select("*").eq("incident_id", id);

  const { data: incidentPersons } = await supabase
    .from("incident_persons")
    .select("role, persons(*), sources:persons(id)")
    .eq("incident_id", id);

  // Fetch sources per person separately (simpler than nested joins here).
  const personsWithSources = await Promise.all(
    (incidentPersons ?? []).map(async (ip: any) => {
      const { data: sources } = await supabase
        .from("sources")
        .select("*")
        .eq("person_id", ip.persons.id);
      return { ...ip, sources: sources ?? [] };
    })
  );

  return (
    <main className="container" style={{ padding: "40px 24px", maxWidth: 780 }}>
      <span className="case-id">CASE {incident.id.slice(0, 8).toUpperCase()}</span>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", margin: "10px 0 6px" }}>
        {incident.title}
      </h1>
      <p className="tier-tag tier-alleged">{incident.status.replace("_", " ")}</p>

      <p style={{ marginTop: 16 }}>{incident.description}</p>
      <p className="entry-meta">
        {incident.date_occurred && <span>Date: {incident.date_occurred}</span>}
        {incident.location_text && <span>Location: {incident.location_text}</span>}
        {incident.department && <span>Dept: {incident.department}</span>}
      </p>

      <hr className="hairline" />
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", marginBottom: 12 }}>
        Footage
      </h2>
      {(videos ?? []).map((v) => (
        <div key={v.id} style={{ marginBottom: 16 }}>
          <video src={v.file_url} controls style={{ width: "100%", border: "1px solid var(--rule)" }} />
          <p className="help">
            Original source: {v.original_source_url || "not provided"} · Reverse-search
            checked: {v.reverse_search_checked ? "yes" : "no"}
          </p>
          <p className="help">Chain of custody: {v.chain_of_custody_notes || "none logged"}</p>
        </div>
      ))}

      <hr className="hairline" />
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", marginBottom: 12 }}>
        People on this case
      </h2>
      {personsWithSources.map((ip: any) => (
        <div key={ip.persons.id} className="entry">
          <TierTag tier={ip.persons.confidence_tier} />
          <PersonEditor
            incidentId={id}
            person={ip.persons}
            role={ip.role}
            existingSources={ip.sources}
          />
        </div>
      ))}

      <div className="entry" style={{ borderStyle: "dashed" }}>
        <p className="eyebrow">Add a person to this case</p>
        <PersonEditor incidentId={id} person={null} role="subject" existingSources={[]} />
      </div>

      <hr className="hairline" />
      <ReviewControls incidentId={id} currentStatus={incident.status} />
    </main>
  );
}

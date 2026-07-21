import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import TierTag from "@/components/TierTag";
import { TIER_DESCRIPTIONS } from "@/lib/verification";

export const revalidate = 0;

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: person } = await supabase.from("persons").select("*").eq("id", id).single();
  if (!person) notFound();

  const { data: sources } = await supabase
    .from("sources")
    .select("id, source_type, url, description")
    .eq("person_id", id);

  const { data: incidentLinks } = await supabase
    .from("incident_persons")
    .select("role, incidents(id, title, date_occurred, status)")
    .eq("person_id", id);

  const publishedIncidents = (incidentLinks ?? []).filter(
    (l: any) => l.incidents?.status === "published"
  );

  return (
    <main className="container" style={{ padding: "40px 24px", maxWidth: 780 }}>
      {person.is_disputed && (
        <div className="disputed-banner">
          This identification has been disputed and is under review by a
          reviewer. Details below may change.
        </div>
      )}

      <TierTag tier={person.confidence_tier} />
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", margin: "10px 0 6px" }}>
        {person.display_name ?? "Unidentified individual"}
      </h1>
      <p style={{ color: "var(--ink-soft)", maxWidth: "60ch" }}>
        {TIER_DESCRIPTIONS[person.confidence_tier as keyof typeof TIER_DESCRIPTIONS]}
      </p>

      {(person.department || person.badge_number) && (
        <p className="eyebrow" style={{ marginTop: 14 }}>
          {person.department}
          {person.badge_number ? ` · Badge ${person.badge_number}` : ""}
        </p>
      )}

      {person.photo_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={person.photo_url}
          alt=""
          style={{ width: 180, height: 180, objectFit: "cover", marginTop: 20, border: "1px solid var(--rule)" }}
        />
      )}

      <hr className="hairline" />
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", marginBottom: 12 }}>
        Sources
      </h2>
      {!sources || sources.length === 0 ? (
        <p style={{ color: "var(--ink-soft)" }}>No sources on file yet.</p>
      ) : (
        <ul style={{ paddingLeft: 20 }}>
          {sources.map((s) => (
            <li key={s.id} style={{ marginBottom: 10 }}>
              <span className="eyebrow">{s.source_type.replace("_", " ")}</span>
              <br />
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.url}
              </a>
              {s.description && <p className="help">{s.description}</p>}
            </li>
          ))}
        </ul>
      )}

      <hr className="hairline" />
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", marginBottom: 12 }}>
        Linked cases
      </h2>
      {publishedIncidents.length === 0 ? (
        <p style={{ color: "var(--ink-soft)" }}>No published cases link to this profile.</p>
      ) : (
        publishedIncidents.map((l: any) => (
          <div key={l.incidents.id} className="entry-meta" style={{ marginBottom: 8 }}>
            <Link href={`/incidents/${l.incidents.id}`}>{l.incidents.title}</Link>
            {l.incidents.date_occurred && <span>{l.incidents.date_occurred}</span>}
          </div>
        ))
      )}

      <hr className="hairline" />
      <Link href={`/persons/${id}/dispute`} className="btn secondary">
        Dispute this identification
      </Link>
    </main>
  );
}

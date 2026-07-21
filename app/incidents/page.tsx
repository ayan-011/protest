import Link from "next/link";
import { createClient } from "@/lib/supabase-server";

export const revalidate = 0;

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string }>;
}) {
  const { department } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("incidents")
    .select("id, title, description, date_occurred, department, created_at")
    .eq("status", "published")
    .order("date_occurred", { ascending: false });

  if (department) query = query.ilike("department", `%${department}%`);

  const { data: incidents } = await query;

  return (
    <main className="container" style={{ padding: "40px 24px" }}>
      <p className="eyebrow">Archive</p>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", margin: "8px 0 24px" }}>
        Published incidents
      </h1>

      <form style={{ marginBottom: 28, maxWidth: 360 }}>
        <label htmlFor="department">Filter by department</label>
        <input
          id="department"
          name="department"
          defaultValue={department ?? ""}
          placeholder="e.g. Springfield PD"
        />
      </form>

      {!incidents || incidents.length === 0 ? (
        <p style={{ color: "var(--ink-soft)" }}>No published incidents match.</p>
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
              {incident.description.slice(0, 200)}
              {incident.description.length > 200 ? "…" : ""}
            </p>
            <div className="entry-meta">
              {incident.department && <span>{incident.department}</span>}
              <Link href={`/incidents/${incident.id}`}>View case →</Link>
            </div>
          </div>
        ))
      )}
    </main>
  );
}

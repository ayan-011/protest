import Link from "next/link";
import { createClient } from "@/lib/supabase-server";

export const revalidate = 0;

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { data: user } = await supabase.auth.getUser();
  const { data: reviewer } = await supabase
    .from("reviewers")
    .select("name, role")
    .eq("id", user.user?.id)
    .single();

  const { data: unreviewed } = await supabase
    .from("incidents")
    .select("id, title, created_at, status")
    .in("status", ["unreviewed", "under_review"])
    .order("created_at", { ascending: true });

  const { data: openDisputes } = await supabase
    .from("disputes")
    .select("id, reason, created_at, persons(display_name)")
    .eq("status", "open")
    .order("created_at", { ascending: true });

  const { data: published } = await supabase
    .from("incidents")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  return (
    <main className="container" style={{ padding: "40px 24px" }}>
      <p className="eyebrow">
        Signed in as {reviewer?.name ?? "reviewer"} · {reviewer?.role ?? ""}
      </p>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", margin: "8px 0 30px" }}>
        Review queue
      </h1>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", marginBottom: 12 }}>
          Awaiting review ({unreviewed?.length ?? 0})
        </h2>
        {!unreviewed || unreviewed.length === 0 ? (
          <p style={{ color: "var(--ink-soft)" }}>Nothing waiting. Queue is clear.</p>
        ) : (
          unreviewed.map((i) => (
            <div key={i.id} className="entry-meta" style={{ marginBottom: 8 }}>
              <Link href={`/admin/incidents/${i.id}`}>{i.title}</Link>
              <span className="tier-tag tier-alleged">{i.status.replace("_", " ")}</span>
            </div>
          ))
        )}
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", marginBottom: 12 }}>
          Open disputes ({openDisputes?.length ?? 0})
        </h2>
        {!openDisputes || openDisputes.length === 0 ? (
          <p style={{ color: "var(--ink-soft)" }}>No open disputes.</p>
        ) : (
          openDisputes.map((d: any) => (
            <div key={d.id} className="entry-meta" style={{ marginBottom: 8 }}>
              <Link href={`/admin/disputes/${d.id}`}>
                {d.persons?.display_name ?? "Unnamed profile"} — {d.reason.slice(0, 60)}…
              </Link>
            </div>
          ))
        )}
      </section>

      <p className="help">{published?.length ?? 0} incidents currently published.</p>
    </main>
  );
}

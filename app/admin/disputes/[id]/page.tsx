import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import DisputeResolver from "./DisputeResolver";

export const revalidate = 0;

export default async function DisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: dispute } = await supabase
    .from("disputes")
    .select("*, persons(*)")
    .eq("id", id)
    .single();

  if (!dispute) notFound();

  return (
    <main className="container" style={{ padding: "40px 24px", maxWidth: 700 }}>
      <p className="eyebrow">Dispute</p>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", margin: "8px 0 6px" }}>
        {dispute.persons?.display_name ?? "Unnamed profile"}
      </h1>
      <p className="help">Submitted {new Date(dispute.created_at).toLocaleString()}</p>

      <div className="entry" style={{ marginTop: 16 }}>
        <p className="eyebrow">Stated reason</p>
        <p>{dispute.reason}</p>
      </div>

      <DisputeResolver disputeId={dispute.id} personId={dispute.person_id} />
    </main>
  );
}

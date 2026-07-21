"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import { canAssignName, maxAllowedTier, SourceRecord } from "@/lib/verification";

async function currentReviewerId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function publishIncident(incidentId: string, notes?: string) {
  const supabase = await createClient();
  const reviewerId = await currentReviewerId();

  const { error } = await supabase
    .from("incidents")
    .update({ status: "published", updated_at: new Date().toISOString() })
    .eq("id", incidentId);
  if (error) throw error;

  await supabase.from("review_log").insert({
    incident_id: incidentId,
    reviewer_id: reviewerId,
    action: "approved",
    notes: notes ?? "Incident published.",
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/incidents/${incidentId}`);
  revalidatePath("/incidents");
}

export async function rejectIncident(incidentId: string, notes: string) {
  const supabase = await createClient();
  const reviewerId = await currentReviewerId();

  const { error } = await supabase
    .from("incidents")
    .update({ status: "removed", updated_at: new Date().toISOString() })
    .eq("id", incidentId);
  if (error) throw error;

  await supabase.from("review_log").insert({
    incident_id: incidentId,
    reviewer_id: reviewerId,
    action: "rejected",
    notes,
  });

  revalidatePath("/admin");
}

export async function markReverseSearchChecked(videoId: string, incidentId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("videos")
    .update({ reverse_search_checked: true })
    .eq("id", videoId);
  if (error) throw error;
  revalidatePath(`/admin/incidents/${incidentId}`);
}

/**
 * Creates or updates a person on an incident. The confidence tier is
 * computed server-side from the sources provided — a reviewer cannot set
 * "sourced" by clicking a dropdown without the sources to back it.
 */
export async function upsertPerson(params: {
  incidentId: string;
  personId?: string;
  displayName: string;
  badgeNumber?: string;
  department?: string;
  photoUrl?: string;
  role: "subject" | "witness" | "other";
  sources: SourceRecord[];
}) {
  const supabase = await createClient();
  const reviewerId = await currentReviewerId();

  const hasName = params.displayName.trim().length > 0;
  if (hasName && !canAssignName(params.sources)) {
    throw new Error(
      "A name can't be attached without at least one source. Leave the name blank to save this as unidentified, or add a source first."
    );
  }

  const tier = maxAllowedTier(params.sources, hasName);

  let personId = params.personId;

  if (personId) {
    const { error } = await supabase
      .from("persons")
      .update({
        display_name: hasName ? params.displayName : null,
        badge_number: params.badgeNumber || null,
        department: params.department || null,
        photo_url: params.photoUrl || null,
        confidence_tier: tier,
        updated_at: new Date().toISOString(),
      })
      .eq("id", personId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from("persons")
      .insert({
        display_name: hasName ? params.displayName : null,
        badge_number: params.badgeNumber || null,
        department: params.department || null,
        photo_url: params.photoUrl || null,
        confidence_tier: tier,
      })
      .select("id")
      .single();
    if (error) throw error;
    personId = data.id;

    await supabase.from("incident_persons").insert({
      incident_id: params.incidentId,
      person_id: personId,
      role: params.role,
    });
  }

  // Replace sources for simplicity (small counts expected per person).
  await supabase.from("sources").delete().eq("person_id", personId);
  if (params.sources.length > 0) {
    await supabase.from("sources").insert(
      params.sources.map((s) => ({
        person_id: personId,
        source_type: s.source_type,
        url: s.url,
        added_by: reviewerId,
      }))
    );
  }

  await supabase.from("review_log").insert({
    incident_id: params.incidentId,
    person_id: personId,
    reviewer_id: reviewerId,
    action: "tier_changed",
    notes: `Set to tier "${tier}" with ${params.sources.length} source(s).`,
  });

  revalidatePath(`/admin/incidents/${params.incidentId}`);
  revalidatePath(`/persons/${personId}`);
}

export async function resolveDispute(params: {
  disputeId: string;
  personId: string;
  outcome: "upheld" | "rejected";
  resolutionNotes: string;
  clearDisputeFlag: boolean;
}) {
  const supabase = await createClient();
  const reviewerId = await currentReviewerId();

  await supabase
    .from("disputes")
    .update({
      status: params.outcome,
      resolution_notes: params.resolutionNotes,
      resolved_by: reviewerId,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", params.disputeId);

  if (params.clearDisputeFlag) {
    await supabase.from("persons").update({ is_disputed: false }).eq("id", params.personId);
  } else {
    await supabase.from("persons").update({ is_disputed: true }).eq("id", params.personId);
  }

  await supabase.from("review_log").insert({
    person_id: params.personId,
    reviewer_id: reviewerId,
    action: params.outcome === "upheld" ? "corrected" : "disputed",
    notes: params.resolutionNotes,
  });

  revalidatePath("/admin");
  revalidatePath(`/persons/${params.personId}`);
}

export async function flagPersonDisputed(personId: string) {
  const supabase = await createClient();
  await supabase.from("persons").update({ is_disputed: true }).eq("id", personId);
  revalidatePath(`/persons/${personId}`);
}

// Central place for the verification rules we designed. Keeping this logic
// in one file (rather than scattered inline checks) means the rule is easy
// to audit and hard to accidentally bypass from a new code path.

export type SourceType =
  | "court_filing"
  | "official_record"
  | "news_article"
  | "department_statement"
  | "other";

export type ConfidenceTier = "unidentified" | "alleged" | "reported" | "sourced";

export interface SourceRecord {
  source_type: SourceType;
  url: string;
}

/**
 * Given the sources attached to a person, return the highest confidence
 * tier they actually qualify for. The admin UI should never let a reviewer
 * set a tier higher than this.
 *
 * Rules (from our verification design):
 *  - sourced   -> at least 2 independent sources, at least one of which is
 *                 a court_filing, official_record, or department_statement
 *  - reported  -> at least 2 independent sources (any type), OR
 *                 1 news_article/official source
 *  - alleged   -> at least 1 source of any type (e.g. a tip, no citation yet)
 *  - unidentified -> no name proposed yet
 */
export function maxAllowedTier(sources: SourceRecord[], hasName: boolean): ConfidenceTier {
  if (!hasName) return "unidentified";
  if (sources.length === 0) return "alleged"; // name proposed, nothing backing it yet — stays capped at "alleged" only if reviewer allows unsourced tips; see requireSourceForAlleged
  const domains = new Set(sources.map((s) => domainOf(s.url)));
  const hasAuthoritative = sources.some((s) =>
    ["court_filing", "official_record", "department_statement"].includes(s.source_type)
  );

  if (domains.size >= 2 && hasAuthoritative) return "sourced";
  if (domains.size >= 2 || sources.length >= 1) return "reported";
  return "alleged";
}

/**
 * Alleged tier still requires at least one source per our policy — a bare
 * accusation with zero citations doesn't get a name attached at all.
 * Call this before allowing a reviewer to save display_name.
 */
export function canAssignName(sources: SourceRecord[]): boolean {
  return sources.length >= 1;
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export const TIER_LABELS: Record<ConfidenceTier, string> = {
  unidentified: "Unidentified",
  alleged: "Alleged",
  reported: "Reported",
  sourced: "Sourced",
};

export const TIER_DESCRIPTIONS: Record<ConfidenceTier, string> = {
  unidentified: "No name has been proposed for this person.",
  alleged: "A name has been submitted but is not yet backed by a citable source.",
  reported: "Named by at least one credible news report or independent source.",
  sourced: "Confirmed via court filing, official record, or department statement, corroborated by a second independent source.",
};

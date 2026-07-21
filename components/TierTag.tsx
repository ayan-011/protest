import { ConfidenceTier, TIER_LABELS } from "@/lib/verification";

export default function TierTag({ tier }: { tier: ConfidenceTier }) {
  return <span className={`tier-tag tier-${tier}`}>{TIER_LABELS[tier]}</span>;
}

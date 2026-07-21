import TierTag from "@/components/TierTag";
import { TIER_DESCRIPTIONS } from "@/lib/verification";

export default function MethodologyPage() {
  return (
    <main className="container" style={{ padding: "40px 24px", maxWidth: 700 }}>
      <p className="eyebrow">How this archive works</p>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", margin: "8px 0 20px" }}>
        Verification standards
      </h1>

      <p>
        Nothing on this site is published automatically. Every submission
        goes into a review queue, where a named reviewer checks the footage
        before anything appears publicly. We don&rsquo;t identify anyone
        based on a crowd&rsquo;s guess — identification only happens when
        it can be tied to a citable source.
      </p>

      <hr className="hairline" />
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", marginBottom: 14 }}>
        Confidence tiers
      </h2>
      <p>Every profile on this site displays one of these four tiers:</p>

      {(["sourced", "reported", "alleged", "unidentified"] as const).map((tier) => (
        <div key={tier} className="entry">
          <TierTag tier={tier} />
          <p style={{ marginTop: 10, marginBottom: 0 }}>{TIER_DESCRIPTIONS[tier]}</p>
        </div>
      ))}

      <hr className="hairline" />
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", marginBottom: 14 }}>
        Rules we follow
      </h2>
      <ul style={{ paddingLeft: 20 }}>
        <li>No name is attached to a profile without at least one citable source.</li>
        <li>
          The <TierTag tier="sourced" /> tier requires two independent
          sources, at least one of which is a court filing, official record,
          or department statement.
        </li>
        <li>Every video is checked to confirm it isn&rsquo;t recycled footage from an unrelated event.</li>
        <li>Every review action is logged against a named reviewer, not an anonymous &ldquo;admin.&rdquo;</li>
        <li>
          Disputed identifications are flagged publicly and re-reviewed —
          corrections are never made silently.
        </li>
      </ul>

      <hr className="hairline" />
      <p style={{ color: "var(--ink-soft)" }}>
        Think an entry is wrong? Every profile has a dispute link. We take
        those seriously and re-review before making changes.
      </p>
    </main>
  );
}

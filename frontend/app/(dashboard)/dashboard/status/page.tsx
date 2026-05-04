export default function VerificationStatusPage() {
  return (
    <div>
      <h1
        className="text-[26px] font-bold text-[var(--text-heading)]"
        style={{ fontFamily: "var(--font-sora), sans-serif" }}
      >
        Verification Status
      </h1>
      <p className="mt-2 max-w-xl text-[14px] text-[var(--text-muted)]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
        Track verification milestones for your campaigns from the overview and campaign detail pages. Deeper status
        tooling will appear here as it ships.
      </p>
    </div>
  );
}

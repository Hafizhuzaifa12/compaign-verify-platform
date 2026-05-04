export default function AnalyticsPage() {
  return (
    <div>
      <h1
        className="text-[26px] font-bold text-[var(--text-heading)]"
        style={{ fontFamily: "var(--font-sora), sans-serif" }}
      >
        Analytics
      </h1>
      <p className="mt-2 max-w-xl text-[14px] text-[var(--text-muted)]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
        Aggregate analytics for your verified campaigns will be available here. Your live campaign data is unchanged in
        the dashboard and detail views.
      </p>
    </div>
  );
}

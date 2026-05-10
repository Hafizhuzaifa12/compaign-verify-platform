export default function CampaignsLoading() {
  return (
    <div className="min-h-screen bg-[var(--surface-page)] p-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="h-10 w-64 max-w-full animate-pulse rounded bg-[var(--border-default)]" />
        <div className="h-64 animate-pulse rounded-lg border border-[var(--border-default)] bg-white" />
      </div>
    </div>
  );
}

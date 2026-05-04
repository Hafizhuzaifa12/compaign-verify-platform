export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[var(--surface-page)] p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="h-8 w-40 animate-pulse rounded bg-[var(--border-default)]" />
          <div className="h-5 w-36 animate-pulse rounded bg-[var(--border-default)]" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg border border-[var(--border-default)] bg-white"
            />
          ))}
        </div>
        <div className="h-32 animate-pulse rounded-lg border border-[var(--border-default)] bg-white" />
      </div>
    </div>
  );
}

type Props = {
  title: string;
  value: number;
  dotClass?: string;
  icon?: React.ReactNode;
};

export default function StatCard({ title, value, dotClass, icon }: Props) {
  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-white p-5 transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="text-[13px] font-medium text-[var(--text-muted)]"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
          >
            {title}
          </p>
          <p
            className="mt-1 text-[32px] font-bold leading-none text-[var(--text-heading)]"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            {value}
          </p>
        </div>
        {icon ? (
          <span className="shrink-0 text-[var(--text-muted)]" aria-hidden>
            {icon}
          </span>
        ) : dotClass ? (
          <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${dotClass}`} aria-hidden />
        ) : null}
      </div>
    </div>
  );
}

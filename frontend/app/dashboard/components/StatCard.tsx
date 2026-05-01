type Props = {
  title: string;
  value: number;
  dotClass: string;
};

export default function StatCard({ title, value, dotClass }: Props) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${dotClass}`} aria-hidden />
        <div className="min-w-0">
          <p
            className="text-[13px] font-medium text-[#64748B]"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
          >
            {title}
          </p>
          <p
            className="mt-1 text-[32px] font-bold leading-none text-[#0F172A]"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-white">
      <section className="flex min-h-[calc(100vh-4rem)] flex-col gap-12 px-4 py-12 lg:flex-row lg:items-center lg:gap-16 lg:px-8">
        <div className="flex flex-1 flex-col justify-center">
          <span className="mb-4 inline-flex w-fit rounded-full bg-[#2563EB]/10 px-3 py-1 text-sm font-medium text-[#2563EB]">
            Trusted Verification Platform
          </span>
          <h1
            className="max-w-xl text-[52px] font-extrabold leading-[1.1] text-[#0F172A]"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            Verify Campaigns.
            <br />
            Build Trust.
          </h1>
          <p
            className="mt-6 max-w-md text-[17px] leading-relaxed text-[#64748B]"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
          >
            Submit marketing content for AI-backed checks and transparent verification — all in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/auth/register"
              className="inline-flex cursor-pointer rounded-lg bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-95"
            >
              Get started
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex cursor-pointer rounded-lg border border-[#2563EB] bg-transparent px-5 py-2.5 text-sm font-medium text-[#2563EB] transition-colors hover:bg-[#F1F5F9]"
            >
              Sign in
            </Link>
          </div>
          <p
            className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#475569]"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
          >
            <span>✓ Free to submit</span>
            <span>✓ Instant results</span>
            <span>✓ Transparent</span>
          </p>
        </div>

        <div className="flex flex-1 justify-center lg:justify-end">
          <div
            className="w-full max-w-md -rotate-2 rounded-[20px] bg-[#0F172A] p-8 text-white shadow-xl"
            style={{ boxShadow: "0 25px 50px -12px rgb(15 23 42 / 0.35)" }}
          >
            <p className="text-sm text-white/70" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              Campaign
            </p>
            <p className="mt-1 text-xl font-semibold" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
              Spring promo · Email
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#16a34a]/20 px-3 py-1 text-xs font-semibold text-[#16a34a]">
              Verified ✓
            </div>
            <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-4/5 rounded-full bg-[#2563EB]" />
            </div>
            <div className="mt-6 flex gap-0.5 text-[#475569]" aria-hidden>
              {"★★★★★".split("").map((s, i) => (
                <span key={i}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#E2E8F0] bg-[#F1F5F9] px-4 py-14 md:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 text-center md:grid-cols-3">
          <div>
            <p className="text-[28px] font-bold text-[#0F172A]" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
              1,200+
            </p>
            <p className="mt-1 text-[14px] text-[#64748B]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              Verified
            </p>
          </div>
          <div>
            <p className="text-[28px] font-bold text-[#0F172A]" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
              98%
            </p>
            <p className="mt-1 text-[14px] text-[#64748B]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              Accuracy
            </p>
          </div>
          <div>
            <p className="text-[28px] font-bold text-[#0F172A]" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
              500+
            </p>
            <p className="mt-1 text-[14px] text-[#64748B]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              Organizations
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:px-8">
        <h2
          className="mb-12 text-center text-[34px] font-bold text-[#0F172A]"
          style={{ fontFamily: "var(--font-sora), sans-serif" }}
        >
          Everything you need
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-lg">
            <svg
              className="mb-4 h-10 w-10 text-[#2563EB]"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <h3
              className="text-lg font-semibold text-[#0F172A]"
              style={{ fontFamily: "var(--font-sora), sans-serif" }}
            >
              Submit Campaign
            </h3>
            <p className="mt-2 text-[#64748B]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              Upload copy and assets for automated screening against policy and quality signals.
            </p>
          </div>
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-lg">
            <svg
              className="mb-4 h-10 w-10 text-[#2563EB]"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M4 19h16M8 17V9l4-4 4 4v8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h3
              className="text-lg font-semibold text-[#0F172A]"
              style={{ fontFamily: "var(--font-sora), sans-serif" }}
            >
              Track Status
            </h3>
            <p className="mt-2 text-[#64748B]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              Follow Pending → Verified progress with risk and trust scores in real time.
            </p>
          </div>
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-lg">
            <svg
              className="mb-4 h-10 w-10 text-[#2563EB]"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M7 3h10v4H7V3zM7 9h10v12H7V9z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h3
              className="text-lg font-semibold text-[#0F172A]"
              style={{ fontFamily: "var(--font-sora), sans-serif" }}
            >
              View Reports
            </h3>
            <p className="mt-2 text-[#64748B]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              Download audit-friendly summaries with AI labels and blockchain checkpoints.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

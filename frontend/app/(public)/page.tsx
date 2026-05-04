import Link from "next/link";

export default function Home() {
  return (
    <div
      className="bg-[var(--surface-page)]"
      style={{
        backgroundImage: "radial-gradient(circle, rgb(125 211 252 / 0.45) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <section className="flex min-h-[calc(100vh-4rem)] flex-col gap-12 px-4 py-12 lg:flex-row lg:items-center lg:gap-8 lg:px-8">
        <div className="flex w-full flex-col justify-center lg:w-[55%]">
          <span
            className="mb-4 inline-flex w-fit rounded-full border border-[var(--brand-primary)] px-3 py-1 text-xs font-medium text-[var(--brand-primary)]"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
          >
            Trusted Verification Platform
          </span>
          <h1
            className="max-w-xl text-[52px] font-extrabold leading-[1.1] text-[var(--text-heading)]"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            Verify Campaigns.
            <br />
            Build Trust.
          </h1>
          <p
            className="mt-4 max-w-md text-[17px] leading-relaxed text-[var(--text-muted)]"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
          >
            Submit marketing content for AI-backed checks and transparent verification — all in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/auth/register"
              className="inline-flex cursor-pointer rounded-lg bg-[var(--brand-primary)] px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-95"
            >
              Get Started
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex cursor-pointer rounded-lg border border-[var(--border-default)] bg-white px-6 py-3 text-sm font-medium text-[var(--text-heading)] transition-colors hover:bg-[var(--surface-subtle)]"
            >
              View Dashboard
            </Link>
          </div>
          <p
            className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-[var(--text-muted)]"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
          >
            <span>✓ Free to submit</span>
            <span>✓ Instant results</span>
            <span>✓ Transparent</span>
          </p>
        </div>

        <div className="flex w-full flex-1 justify-center lg:w-[45%] lg:justify-end">
          <div
            className="w-full max-w-md -rotate-2 rounded-2xl bg-[var(--site-nav-bg)] p-6 text-white shadow-2xl"
            style={{ boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)" }}
          >
            <p className="text-sm text-white/70" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              Campaign
            </p>
            <p className="mt-1 text-xl font-semibold text-white" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
              Spring promo · Email
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-sky-400/20 px-3 py-1 text-xs font-semibold text-sky-100">
              Verified ✓
            </div>
            <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-4/5 rounded-full bg-sky-300" />
            </div>
            <div className="mt-6 flex gap-0.5 text-sky-200" aria-hidden>
              {"★★★★★".split("").map((s, i) => (
                <span key={i}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border-default)] bg-[var(--surface-subtle)] py-10">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 text-center md:grid-cols-3 md:px-8">
          <div>
            <p className="text-[32px] font-bold text-[var(--text-heading)]" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
              1,200+
            </p>
            <p className="mt-1 text-[14px] text-[var(--text-muted)]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              Campaigns
            </p>
          </div>
          <div>
            <p className="text-[32px] font-bold text-[var(--text-heading)]" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
              98%
            </p>
            <p className="mt-1 text-[14px] text-[var(--text-muted)]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              Accuracy
            </p>
          </div>
          <div>
            <p className="text-[32px] font-bold text-[var(--text-heading)]" style={{ fontFamily: "var(--font-sora), sans-serif" }}>
              500+
            </p>
            <p className="mt-1 text-[14px] text-[var(--text-muted)]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              Organizations
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl bg-white px-4 py-20 md:px-8">
        <h2
          className="mb-3 text-center text-[36px] font-bold text-[var(--text-heading)]"
          style={{ fontFamily: "var(--font-sora), sans-serif" }}
        >
          Everything you need
        </h2>
        <p
          className="mx-auto mb-12 max-w-2xl text-center text-[16px] text-[var(--text-muted)]"
          style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
        >
          One platform to submit, verify, and report on campaign integrity.
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border-default)] bg-white p-6 transition-shadow duration-200 hover:shadow-md">
            <svg
              className="mb-4 h-10 w-10 text-[var(--brand-primary)]"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <h3
              className="text-lg font-semibold text-[var(--text-heading)]"
              style={{ fontFamily: "var(--font-sora), sans-serif" }}
            >
              Submit Campaign
            </h3>
            <p className="mt-2 text-[var(--text-muted)]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              Upload copy and assets for automated screening against policy and quality signals.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border-default)] bg-white p-6 transition-shadow duration-200 hover:shadow-md">
            <svg
              className="mb-4 h-10 w-10 text-[var(--brand-primary)]"
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
              className="text-lg font-semibold text-[var(--text-heading)]"
              style={{ fontFamily: "var(--font-sora), sans-serif" }}
            >
              Track Status
            </h3>
            <p className="mt-2 text-[var(--text-muted)]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              Follow Pending → Verified progress with risk and trust scores in real time.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border-default)] bg-white p-6 transition-shadow duration-200 hover:shadow-md">
            <svg
              className="mb-4 h-10 w-10 text-[var(--brand-primary)]"
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
              className="text-lg font-semibold text-[var(--text-heading)]"
              style={{ fontFamily: "var(--font-sora), sans-serif" }}
            >
              View Reports
            </h3>
            <p className="mt-2 text-[var(--text-muted)]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              Download audit-friendly summaries with AI labels and blockchain checkpoints.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

import CampaignForm from "@/components/forms/CampaignForm";

function SubmitLeftIllustration() {
  return (
    <div className="relative flex w-full max-w-[220px] flex-col items-center justify-center px-3">
      <svg
        className="mb-8 h-auto w-full max-w-[180px]"
        viewBox="0 0 200 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <circle cx="170" cy="40" r="6" fill="white" fillOpacity="0.35" />
        <circle cx="30" cy="55" r="4" fill="white" fillOpacity="0.2" />
        <circle cx="165" cy="175" r="8" fill="white" fillOpacity="0.15" />
        <circle cx="25" cy="165" r="5" fill="white" fillOpacity="0.3" />
        <path
          d="M15 120 L35 100"
          stroke="white"
          strokeOpacity="0.25"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M175 95 L190 75"
          stroke="white"
          strokeOpacity="0.2"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M50 30 Q100 10 150 30"
          stroke="white"
          strokeOpacity="0.15"
          strokeWidth="1.5"
          fill="none"
        />
        <circle cx="100" cy="28" r="3" fill="white" fillOpacity="0.4" />
        <path
          d="M100 45 L118 55 V95 C118 120 100 138 100 138 C100 138 82 120 82 95 V55 L100 45Z"
          fill="white"
          fillOpacity="0.12"
          stroke="white"
          strokeOpacity="0.35"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M100 52 L112 59 V92 C112 112 100 126 100 126 C100 126 88 112 88 92 V59 L100 52Z"
          fill="white"
          fillOpacity="0.08"
        />
        <path
          d="M88 95 L96 105 L114 78"
          stroke="white"
          strokeOpacity="0.9"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="140" cy="130" r="14" fill="white" fillOpacity="0.1" />
        <circle cx="55" cy="125" r="10" fill="white" fillOpacity="0.18" />
      </svg>

      <h2
        className="text-center text-[20px] font-bold leading-tight text-white"
        style={{ fontFamily: "var(--font-sora), sans-serif" }}
      >
        Submit Your Campaign
      </h2>
      <p
        className="mx-auto mt-3 max-w-[160px] text-center text-[13px] leading-snug text-white/60"
        style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
      >
        We review every submission carefully.
      </p>
      <ul
        className="mt-6 w-full max-w-[180px] text-[12px] leading-relaxed text-white/80"
        style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
      >
        <li className="mt-2">✓ Instant submission</li>
        <li className="mt-2">✓ Expert review</li>
        <li className="mt-2">✓ Full transparency</li>
      </ul>
    </div>
  );
}

export default function SubmitPage() {
  return (
    <div className="flex min-h-[calc(100vh-60px)] w-full max-w-none flex-col bg-[var(--surface-page)] md:flex-row">
      {/* <aside
        className="relative hidden w-full shrink-0 flex-col items-center justify-center bg-[var(--site-nav-bg)] md:sticky md:top-0 md:flex md:h-[calc(100vh-60px)] md:w-1/4 md:self-start md:overflow-y-auto"
        aria-hidden
      >
        <SubmitLeftIllustration />
      </aside> */}

      <div className="flex w-full flex-1 flex-col bg-white px-6 py-8 md:w-3/4 md:max-w-none md:px-10 md:py-8">
        <header className="mb-5 md:mb-6">
          <h1
            className="text-[28px] font-bold text-[var(--text-heading)]"
            style={{ fontFamily: "var(--font-sora), sans-serif" }}
          >
            Submit a Campaign
          </h1>
          <p
            className="mt-1 text-[var(--text-muted)]"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
          >
            Fill in the details below
          </p>
        </header>
        <div className="w-full rounded-2xl border border-[var(--border-default)] bg-white p-6 shadow-sm md:p-8">
          <CampaignForm />
        </div>
      </div>
    </div>
  );
}
